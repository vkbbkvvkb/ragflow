from flask import request
from flask_login import login_required, current_user

from api.db.services.setting_service import SettingService
from api.utils import get_uuid
from api.utils.api_utils import get_json_result
from api.utils.api_utils import server_error_response, get_data_error_result


@manager.route('/save', methods=['post'])
@login_required
def save():
    req = request.json
    try:
        if "id" not in req or req["id"] is None:
            # 创建
            req["id"] = get_uuid()
            req["tenant_id"] = current_user.id
            if not SettingService.save(**req):
                return get_data_error_result()
        else:
            # 更新
            if not SettingService.update_by_id(req["id"], req):
                return get_data_error_result()

        e, setting = SettingService.get_by_id(current_user.id)
        if not e:
            return get_data_error_result(
                retmsg="Database error (Setting)!")

        return get_json_result(data=setting.to_json())
    except Exception as e:
        return server_error_response(e)


@manager.route('/detail', methods=['GET'])
@login_required
def detail():
    try:
        e, setting = SettingService.get_by_id(current_user.id)
        if not e:
            return get_data_error_result(
                retmsg="当前没有已保存的配置(将使用默认配置)")
        return get_json_result(data=setting.to_json())
    except Exception as e:
        return server_error_response(e)
