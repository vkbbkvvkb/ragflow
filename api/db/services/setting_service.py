from copy import deepcopy

from biorun.convert import false

from api.db import LLMType, ParserType
from api.db.db_models import DB
from api.db.db_models import Setting
from api.db.services.common_service import CommonService
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.db.services.llm_service import LLMBundle
from api.settings import retrievaler, kg_retrievaler
from rag.utils import num_tokens_from_string


class SettingService(CommonService):
    model = Setting

    @classmethod
    @DB.connection_context()
    def get_by_id(cls, tenant_id):
        try:
            obj = cls.model.query(tenant_id=tenant_id)[0]
            return True, obj
        except Exception as e:
            return False, None


def ask(question, kb_ids, tenant_id):
    kbs = KnowledgebaseService.get_by_ids(kb_ids)
    embd_nms = list(set([kb.embd_id for kb in kbs]))

    is_kg = all([kb.parser_id == ParserType.KG for kb in kbs])
    retr = retrievaler if not is_kg else kg_retrievaler

    embd_mdl = LLMBundle(tenant_id, LLMType.EMBEDDING, embd_nms[0])
    # 默认值
    llm_id = None
    max_tokens = 0
    temperature = 0.1
    topk = 12
    similarity_threshold = 0.1
    vector_similarity_weight = 0.3
    prompt = """
    Role: You're a smart assistant. Your name is Miss R.
    Task: Summarize the information from knowledge bases and answer user's question.
    Requirements and restriction:
      - DO NOT make things up, especially for numbers.
      - If the information from knowledge is irrelevant with user's question, JUST SAY: Sorry, no relevant information provided.
      - Answer with markdown format text.
      - Answer in language of user's question.
      - DO NOT make things up, especially for numbers.
      
    ### Information from knowledge bases
    {knowledge}
    
    The above is information from knowledge bases.
     
    """
    # 获取用户配置信息
    e, setting = SettingService.get_by_id(tenant_id)
    if not e:
        print("当前没有已保存的配置(将使用默认配置)")
    else :
        llm_id = setting.llm_id
        topk = setting.top_n
        similarity_threshold = setting.similarity_threshold
        vector_similarity_weight = setting.vector_similarity_weight
        max_tokens = setting.llm_setting["max_tokens"]
        temperature = setting.llm_setting["temperature"]
        prompt = setting.prompt_config["system"]
    chat_mdl = LLMBundle(tenant_id, LLMType.CHAT, llm_id)
    max_tokens = max_tokens if e else chat_mdl.max_length

    kbinfos = retr.retrieval(question, embd_mdl, tenant_id, kb_ids, 1, topk,
                             similarity_threshold, vector_similarity_weight,
                             aggs=False)
    knowledges = [ck["content_with_weight"] for ck in kbinfos["chunks"]]

    used_token_count = 0
    for i, c in enumerate(knowledges):
        used_token_count += num_tokens_from_string(c)
        if max_tokens * 0.97 < used_token_count:
            knowledges = knowledges[:i]
            break

    prompt = prompt.format(knowledge="\n".join(knowledges))
    msg = [{"role": "user", "content": question}]
    def decorate_answer(answer):
        nonlocal knowledges, kbinfos, prompt, vector_similarity_weight
        answer, idx = retr.insert_citations(answer,
                                            [ck["content_ltks"]
                                             for ck in kbinfos["chunks"]],
                                            [ck["vector"]
                                             for ck in kbinfos["chunks"]],
                                            embd_mdl,
                                            tkweight=round(1-vector_similarity_weight, 2),
                                            vtweight=vector_similarity_weight)
        idx = set([kbinfos["chunks"][int(i)]["doc_id"] for i in idx])
        recall_docs = [
            d for d in kbinfos["doc_aggs"] if d["doc_id"] in idx]
        if not recall_docs: recall_docs = kbinfos["doc_aggs"]
        kbinfos["doc_aggs"] = recall_docs
        refs = deepcopy(kbinfos)
        for c in refs["chunks"]:
            if c.get("vector"):
                del c["vector"]

        if answer.lower().find("invalid key") >= 0 or answer.lower().find("invalid api") >= 0:
            answer += " Please set LLM API-Key in 'User Setting -> Model Providers -> API-Key'"
        return {"answer": answer, "reference": refs}

    answer = ""
    for ans in chat_mdl.chat_streamly(prompt, msg, {"temperature": temperature}):
        answer = ans
        yield {"answer": answer, "reference": {}}
    yield decorate_answer(answer)

