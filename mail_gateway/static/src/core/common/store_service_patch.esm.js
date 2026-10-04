import {Store} from "@mail/core/common/store_service";
import {patch} from "@web/core/utils/patch";

patch(Store.prototype, {
  async getMessagePostParams({thread}) {
    const params = await super.getMessagePostParams(...arguments);
    if (thread.gateway_notifications?.length) {
      params.post_data.gateway_notifications = thread.gateway_notifications;
    }
    return params;
  },
});
