import {DiscussApp} from "@mail/core/public_web/discuss_app_model";
import {fields} from "@mail/core/common/record";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";

patch(DiscussApp.prototype, {
  setup() {
    super.setup(...arguments);
    this.gateway = fields.One("DiscussAppCategory", {
      compute() {
        return {
          extraClass: "o-mail-DiscussSidebarCategory-gateway",
          icon: "fa fa-plane",
          id: "gateway",
          name: _t("Gateway"),
          sequence: 25,
          serverStateKey: "is_discuss_sidebar_category_gateway_open",
        };
      },
      eager: true,
    });
  },
});
