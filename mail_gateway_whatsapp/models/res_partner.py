# Copyright 2024 Dixmit
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import models


class ResPartner(models.Model):
    # phone_validation already makes res.partner a mail.thread.phone and, since
    # 19.0, `phone` is the only number field of a partner (no more `mobile`).
    _inherit = "res.partner"

    def _whatsapp_get_partner(self):
        return self
