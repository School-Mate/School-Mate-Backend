import { Webhook } from "@/interfaces/webhook.interface";
import { WebhookType } from "@/types";
import { Report, UserSchoolVerify } from "@prisma/client";
import fetch from 'node-fetch';
import { discordCodeBlock, userHyperlink } from "./util";
import { logger } from "./logger";

export const sendWebhook = async (data: Webhook) => {
    try{
        const params = buildParams(data);

        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params),
        })
    } catch (error) {
        logger.error(error);
    }
}

const buildParams = (data: Webhook) => {
    switch(data.type) {
        case WebhookType.VerifyRequest:
            const req: UserSchoolVerify = data.data;
            return {
                content: `[VERIFY/REQUEST] ${req.id}`,
                embeds: [
                    {
                        title: '[VERIFY/REQUEST]',
                        description: `ID: ${req.id}\n유저 정보: ${userHyperlink(req.userId, req.userName)}\n요청 정보: ${req.schoolName} ${req.grade}-${req.class} (${req.dept || '일반학과'})`,
                        timestamp: req.createdAt,
                        footer: {
                            text: `ID: ${req.id}`
                        }
                    }
                ]
            }
        case WebhookType.VerifyAccept:
            const req1: UserSchoolVerify = data.data;
            return {
                content: `[VERIFY/ACCEPT] ${req1.id}`,
                embeds: [
                    {
                        title: '[VERIFY/ACCEPT]',
                        description: `ID: ${req1.id}\n유저 정보: ${userHyperlink(req.userId, req.userName)}\n요청 정보: ${req1.schoolName} ${req1.grade}-${req1.class} (${req1.dept || '일반학과'})`,
                        timestamp: new Date(),
                        footer: {
                            text: `ID: ${req1.id}`
                        },
                        color: 0x00ff00,
                    }
                ]
            }
        case WebhookType.VerifyReject:
            const req2: UserSchoolVerify = data.data;
            return {
                content: `[VERIFY/REJECT] ${req2.id}`,
                embeds: [
                    {
                        title: '[VERIFY/REJECT]',
                        description: `ID: ${req2.id}\n유저 정보: ${userHyperlink(req.userId, req.userName)}\n요청 정보: ${req2.schoolName} ${req2.grade}-${req2.class} (${req2.dept || '일반학과'})`,
                        fields: [
                            {
                                name: '사유',
                                value: discordCodeBlock(req2.message),
                            }
                        ],
                        timestamp: new Date(),
                        footer: {
                            text: `ID: ${req2.id}`
                        },
                        color: 0xff0000,
                    }
                ]
            }
        case WebhookType.ReportCreate:
            const report: Report = data.data;
            return {
                content: `[REPORT/CREATE] ${report.id}`,
                embeds: [
                    {
                        title: '[REPORT/CREATE]',
                        description: `ID: ${report.id}\n신고자: ${userHyperlink(report.reportUserId, report.reportUserName)}\n신고 대상: ${report.targetId} **(${report.targetType})**`,
                        fields: [
                            {
                                name: '신고 내용',
                                value: discordCodeBlock(report.message),
                            }
                        ],
                        timestamp: report.createdAt,
                        footer: {
                            text: `ID: ${report.id}`
                        }
                    }
                ]
            }
        case WebhookType.ReportComplete:
            const report1: Report = data.data;
            return {
                content: `[REPORT/COMPLETE] ${report1.id}`,
                description: `ID: ${report1.id}\n신고자: ${userHyperlink(report1.reportUserId, report1.reportUserName)}\n신고 대상: ${report1.targetId} **(${report1.targetType})**`,
                fields: [
                    {
                        name: '신고 내용',
                        value: discordCodeBlock(report1.message),
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: `ID: ${report1.id}`
                },
                color: 0x00ff00,
            }
    }
}
