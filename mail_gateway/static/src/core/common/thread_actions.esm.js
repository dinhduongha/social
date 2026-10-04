import {_t} from "@web/core/l10n/translation";
import {registerThreadAction} from "@mail/core/common/thread_actions";

registerThreadAction("open-gw-new-partner", {
  condition({owner, store, thread}) {
    if (
      thread?.channel_type !== "gateway" ||
      (owner.props.chatWindow && !owner.props.chatWindow.isOpen)
    ) {
      return false;
    }
    if (thread._guestChecked) {
      return Boolean(thread._cachedGuestId);
    }
    const orm = store.env.services.orm;
    (async () => {
      const members = await orm.silent.searchRead(
        "discuss.channel.member",
        [["channel_id", "=", thread.id]],
        ["guest_id"]
      );
      const guestMembers = members.filter((m) => m.guest_id);

      if (guestMembers.length === 1) {
        thread._cachedGuestId = guestMembers[0].guest_id;
      } else {
        thread._cachedGuestId = null;
      }
      thread._guestChecked = true;
    })();
    return false;
  },
  icon: "fa fa-fw fa-address-book",
  name: _t("New Partner"),
  async open({store, thread}) {
    const guestId = thread._cachedGuestId;
    if (!guestId) {
      return;
    }
    await store.env.services.action.doAction({
      type: "ir.actions.act_window",
      res_model: "mail.guest.manage",
      context: {default_guest_id: guestId[0]},
      views: [[false, "form"]],
      target: "new",
    });
  },
  sequence: 18,
});
registerThreadAction("open-gw-profile", {
  condition({owner, store, thread}) {
    // Check basic conditions
    if (
      thread?.channel_type !== "gateway" ||
      (owner.props.chatWindow && !owner.props.chatWindow.isOpen)
    ) {
      return false;
    }
    if (thread._partnerIdChecked) {
      return Boolean(thread._cachedPartnerId);
    }
    const orm = store.env.services.orm;
    let partnerId = null;
    (async () => {
      const channelData = await orm.silent.searchRead(
        "discuss.channel",
        [["id", "=", thread.id]],
        ["gateway_channel_token"]
      );
      if (channelData[0]?.gateway_channel_token) {
        const gatewayChannel = await orm.silent.searchRead(
          "res.partner.gateway.channel",
          [["gateway_token", "=", channelData[0].gateway_channel_token]],
          ["partner_id"]
        );
        partnerId = Array.isArray(gatewayChannel[0]?.partner_id)
          ? gatewayChannel[0].partner_id[0]
          : gatewayChannel[0]?.partner_id;
      } else {
        partnerId = thread.correspondent?.partner_id?.id;
      }
      thread._cachedPartnerId = partnerId;
      thread._partnerIdChecked = true;
    })();
    return false;
  },
  icon: "fa fa-fw fa-user-circle-o",
  name: _t("Open Contact"),
  async open({store, thread}) {
    const partnerId = thread._cachedPartnerId;
    await store.env.services.action.doAction({
      type: "ir.actions.act_window",
      res_model: "res.partner",
      res_id: partnerId,
      views: [[false, "form"]],
    });
  },
  sequence: 17,
});
