import {Composer} from "@mail/core/common/composer";
import {_t} from "@web/core/l10n/translation";
import {patch} from "@web/core/utils/patch";
import {toRaw} from "@odoo/owl";

patch(Composer.prototype, {
  get SEND_TEXT() {
    if (this.props.type === "gateway" && !this.props.composer.message) {
      return _t("Send gateway");
    }
    return super.SEND_TEXT;
  },
  get placeholder() {
    if (
      this.thread?.model !== "discuss.channel" &&
      !this.props.placeholder &&
      this.props.type === "gateway"
    ) {
      return _t("Send a message to a gateway...");
    }
    return super.placeholder;
  },
  get isSendButtonDisabled() {
    const isSendButtonDisabled = super.isSendButtonDisabled;
    if (this.props.type !== "gateway") {
      return isSendButtonDisabled;
    }
    return isSendButtonDisabled || !this.thread?.gateway_notifications?.length;
  },
  onFocusin() {
    super.onFocusin(...arguments);
    if (this.props.type !== "gateway" && this.thread) {
      this.thread.gateway_notifications = [];
    }
  },
  async sendMessage() {
    if (this.props.type !== "gateway" || toRaw(this.props.composer).message) {
      return super.sendMessage(...arguments);
    }
    // Gateway recipients are reached through their gateway channel: skip
    // the email check that core does on the suggested recipients.
    await this.processMessage(async (value) => {
      await this._sendMessage(value, this.postData, this.extraData);
    });
  },
  async onClickFullComposer() {
    if (this.props.type !== "gateway") {
      return super.onClickFullComposer(...arguments);
    }
    const followers = this.thread.gateway_followers;
    const context = {
      default_attachment_ids: this.props.composer.attachments.map(
        (attachment) => attachment.id
      ),
      default_body: this.formatDefaultBodyForFullComposer(
        this.props.composer.composerHtml
      ),
      default_model: this.thread.model,
      default_partner_ids: this.thread.suggestedRecipients
        .filter((recipient) => recipient.partner_id)
        .map((recipient) => recipient.partner_id),
      default_res_ids: [this.thread.id],
      default_subtype_xmlid: "mail.mt_comment",
      default_wizard_partner_ids: [
        ...new Set(followers.map((follower) => follower.id)),
      ],
      default_wizard_channel_ids: [
        ...new Set(
          followers.flatMap((follower) =>
            follower.gateway_channels.map((channel) => channel.id)
          )
        ),
      ],
    };
    const action = {
      name: _t("Gateway message"),
      type: "ir.actions.act_window",
      res_model: "mail.compose.gateway.message",
      view_mode: "form",
      views: [[false, "form"]],
      target: "new",
      context: context,
    };
    const options = {
      onClose: (args) => {
        // args === { dismiss: true } : click on 'X' or press escape
        // args === { special: true } : click on 'discard'
        const isDiscard = args?.dismiss || args?.special;
        if (!isDiscard) {
          this.clear();
        }
        this.props.composer.replyToMessage = undefined;
        this.onCloseFullComposerCallback(isDiscard);
      },
    };
    await this.env.services.action.doAction(action, options);
  },
});
