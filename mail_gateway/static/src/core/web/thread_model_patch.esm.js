import {Thread} from "@mail/core/common/thread_model";
import {fields} from "@mail/core/common/record";
import {imageUrl} from "@web/core/utils/urls";
import {patch} from "@web/core/utils/patch";

patch(Thread.prototype, {
  setup() {
    super.setup(...arguments);
    this.gateway = fields.One("Gateway");
    this.gateway_notifications = [];
    this.gateway_followers = fields.Many("res.partner");
  },
  get allowedToLeaveChannelTypes() {
    return [...super.allowedToLeaveChannelTypes, "gateway"];
  },
  get isChatChannel() {
    return this.channel_type === "gateway" || super.isChatChannel;
  },
  get hasMemberList() {
    return this.channel_type === "gateway" || super.hasMemberList;
  },
  get avatarUrl() {
    if (this.channel_type !== "gateway") {
      return super.avatarUrl;
    }
    return imageUrl("discuss.channel", this.id, "avatar_128", {
      unique: this.avatar_cache_key,
    });
  },
  _computeDiscussAppCategory() {
    if (this.channel_type === "gateway") {
      return this.store.discuss.gateway;
    }
    return super._computeDiscussAppCategory(...arguments);
  },
});
