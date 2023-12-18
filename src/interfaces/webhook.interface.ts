import { WebhookType } from "@/types";

export interface Webhook {
    type: WebhookType;
    data?: any;
}