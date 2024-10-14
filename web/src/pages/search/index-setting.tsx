import LLMSelect from '@/components/llm-select';
import { IModalManagerChildrenProps } from '@/components/modal-manager';
import Rerank from '@/components/rerank';
import SimilaritySlider from '@/components/similarity-slider';
import TopNItem from '@/components/top-n-item';
import { useTranslate } from '@/hooks/common-hooks';
import { ISetting } from '@/interfaces/database/search';
import { Form, Input, Modal } from 'antd';
import { useSetLlmSetting } from './hooks';

interface IProps extends Omit<IModalManagerChildrenProps, 'showModal'> {
  loading: boolean;
  onOk: (ret: ISetting) => void;
  data: any;
}

const SettingModal = ({ visible, hideModal, loading, data, onOk }: IProps) => {
  const { t } = useTranslate('search');
  const [form] = Form.useForm();
  useSetLlmSetting(form);
  const handleOk = async () => {
    const ret = await form.validateFields();
    console.log('ret', ret);
    const finalValues = {
      id: ret.id,
      tenant_id: ret.tenant_id,
      llm_id: ret.llm_id,
      llm_setting: {
        temperature: ret.temperature,
        top_p: ret.top_p,
        frequency_penalty: ret.frequency_penalty,
        presence_penalty: ret.presence_penalty,
        max_tokens: ret.max_tokens,
      },
      prompt_config: {
        system: ret.prompt,
      },
      similarity_threshold: ret.similarity_threshold,
      vector_similarity_weight: 1 - parseInt(ret.vector_similarity_weight),
      top_n: ret.top_n,
      rerank_id: ret.rerank_id,
      top_k: ret.top_k,
    };
    onOk(finalValues);
  };

  return (
    <Modal
      title={t('title')}
      open={visible}
      onOk={handleOk}
      onCancel={hideModal}
      okButtonProps={{ loading }}
    >
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 25 }}
        autoComplete="off"
        form={form}
        onValuesChange={(changedValues, allValues) => {
          console.log('changed values:', changedValues);
          console.log('all values:', allValues);
          form?.setFieldsValue(changedValues);
        }}
      >
        <Form.Item
          name={'llm_id'}
          label={t('model', { keyPrefix: 'chat' })}
          tooltip={t('modelTip', { keyPrefix: 'chat' })}
        >
          <LLMSelect></LLMSelect>
        </Form.Item>
        <Form.Item
          name={['prompt']}
          label={t('prompt', { keyPrefix: 'knowledgeConfiguration' })}
          initialValue={t('promptText')}
          tooltip={t('promptTip', { keyPrefix: 'knowledgeConfiguration' })}
          rules={[
            {
              required: true,
              message: t('promptMessage', {
                keyPrefix: 'knowledgeConfiguration',
              }),
            },
          ]}
        >
          <Input.TextArea rows={8} />
        </Form.Item>
        <SimilaritySlider isTooltipShown></SimilaritySlider>
        <TopNItem initialValue={12}></TopNItem>
        <Rerank></Rerank>
      </Form>
    </Modal>
  );
};

export default SettingModal;
