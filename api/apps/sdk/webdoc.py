import re

import requests
from flask import request

from api.db import FileType
from api.db import ParserType
from api.db.services.document_service import DocumentService
from api.db.services.file_service import FileService
from api.db.services.knowledgebase_service import KnowledgebaseService
from api.settings import RetCode
from api.utils import get_uuid
from api.utils.api_utils import get_json_result
from api.utils.api_utils import server_error_response
from api.utils.api_utils import token_required
from api.utils.file_utils import filename_type, thumbnail
from api.utils.web_utils import is_valid_url
from rag.utils.storage_factory import STORAGE_IMPL


@manager.route('/dataset/documents/download', methods=['POST'])
@token_required
def web_download(tenant_id):
    kb_id = request.form.get("kb_id")
    if not kb_id:
        return get_json_result(
            data=False, retmsg='Lack of "KB ID"', retcode=RetCode.ARGUMENT_ERROR)
    name = request.form.get("name")
    filetype = filename_type(name)
    if filetype == FileType.OTHER.value:
        raise RuntimeError("This type of file has not been supported yet!")
    url = request.form.get("url")
    if not is_valid_url(url):
        return get_json_result(
            data=False, retmsg='The URL format is invalid', retcode=RetCode.ARGUMENT_ERROR)
    e, kb = KnowledgebaseService.get_by_id(kb_id)
    if not e:
        raise LookupError("Can't find this knowledgebase!")
    # 从url获取文件内容
    headers = {
        'Authorization': request.headers.get('Authorization')
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        blob = response.content
    else:
        print('Failed to retrieve file from URL.')
        return server_error_response(ValueError("Download failure."))

    root_folder = FileService.get_root_folder(tenant_id)
    pf_id = root_folder["id"]
    FileService.init_knowledgebase_docs(pf_id, tenant_id)
    kb_root_folder = FileService.get_kb_folder(tenant_id)
    kb_folder = FileService.new_a_file_from_kb(kb.tenant_id, kb.name, kb_root_folder["id"])

    try:
        location = name
        while STORAGE_IMPL.obj_exist(kb_id, location):
            location += "_"
        STORAGE_IMPL.put(kb_id, location, blob)
        doc = {
            "id": get_uuid(),
            "kb_id": kb.id,
            "parser_id": kb.parser_id,
            "parser_config": kb.parser_config,
            "created_by": tenant_id,
            "type": filetype,
            "name": name,
            "location": location,
            "size": len(blob),
            "thumbnail": thumbnail(name, blob)
        }
        if doc["type"] == FileType.VISUAL:
            doc["parser_id"] = ParserType.PICTURE.value
        if doc["type"] == FileType.AURAL:
            doc["parser_id"] = ParserType.AUDIO.value
        if re.search(r"\.(ppt|pptx|pages)$", name):
            doc["parser_id"] = ParserType.PRESENTATION.value
        if re.search(r"\.(eml)$", name):
            doc["parser_id"] = ParserType.EMAIL.value
        DocumentService.insert(doc)
        FileService.add_file_from_kb(doc, kb_folder["id"], kb.tenant_id)
    except Exception as e:
        return server_error_response(e)
    return get_json_result(data=True)