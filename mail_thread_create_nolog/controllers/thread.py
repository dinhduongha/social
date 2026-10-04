from odoo import http
from odoo.http import request

from odoo.addons.mail.controllers import thread as mail_thread
from odoo.addons.mail.tools.discuss import Store


class ThreadController(mail_thread.ThreadController):
    @http.route("/mail/thread/messages", methods=["POST"], type="jsonrpc", auth="user")
    def mail_thread_messages(self, thread_model, thread_id, fetch_params=None):
        result = super().mail_thread_messages(
            thread_model, thread_id, fetch_params=fetch_params
        )
        # Parameter after is only set when refreshing the mail thread view
        #  to fetch new messages from other users. That means if it's there,
        #  the ".. created" message was already generated on the fly and we
        #  do not need to generate it again
        if (fetch_params or {}).get("after") is not None:
            return result

        domain = [
            ("res_id", "=", int(thread_id)),
            ("model", "=", thread_model),
            ("message_type", "!=", "user_notification"),
        ]

        message, author = request.env["mail.message"]._generate_messsage(domain)

        if message:
            extra = (
                Store()
                .add(author)
                .add_model_values("mail.message", message)
                .get_result()
            )
            for model_name, records in extra.items():
                existing = result["data"].setdefault(model_name, [])
                known_ids = {rec.get("id") for rec in existing}
                existing.extend(
                    rec for rec in records if rec.get("id") not in known_ids
                )
            result["messages"].append(message["id"])

        return result
