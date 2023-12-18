import { Webhook } from '@/interfaces/webhook.interface';
import { WebhookType } from '@/types';
import { BoardRequest, Report, UserSchoolVerify } from '@prisma/client';
import { discordCodeBlock, userHyperlink } from './util';
import { logger } from './logger';
import { ArticleWithBoard } from '@/interfaces/board.interface';
import axios from 'axios';
import { DISCORD_WEBHOOK_URL } from '@/config';

export const sendWebhook = async (data: Webhook) => {
  try {
    const params = buildParams(data);

    await axios.post(DISCORD_WEBHOOK_URL, {
      data: params,
    });
  } catch (error) {
    logger.error(error);
  }
};

const buildParams = (data: Webhook) => {
  switch (data.type) {
    case WebhookType.VerifyRequest:
      const req: UserSchoolVerify = data.data;
      return {
        content: `[VERIFY/REQUEST] ${req.id}`,
        embeds: [
          {
            title: '[VERIFY/REQUEST]',
            description: `유저 정보: ${userHyperlink(req.userId, req.userName)}\n요청 정보: ${req.schoolName} ${req.grade}-${req.class} (${
              req.dept || '일반학과'
            })`,
            timestamp: req.createdAt,
            footer: {
              text: `ID: ${req.id}`,
            },
          },
        ],
      };
    case WebhookType.VerifyAccept:
      const req1: UserSchoolVerify = data.data;
      return {
        content: `[VERIFY/ACCEPT] ${req1.id}`,
        embeds: [
          {
            title: '[VERIFY/ACCEPT]',
            description: `유저 정보: ${userHyperlink(req1.userId, req1.userName)}\n요청 정보: ${req1.schoolName} ${req1.grade}-${req1.class} (${
              req1.dept || '일반학과'
            })`,
            timestamp: new Date(),
            footer: {
              text: `ID: ${req1.id}`,
            },
            color: 0x00ff00,
          },
        ],
      };
    case WebhookType.VerifyReject:
      const req2: UserSchoolVerify = data.data;
      return {
        content: `[VERIFY/REJECT] ${req2.id}`,
        embeds: [
          {
            title: '[VERIFY/REJECT]',
            description: `유저 정보: ${userHyperlink(req2.userId, req2.userName)}\n요청 정보: ${req2.schoolName} ${req2.grade}-${req2.class} (${
              req2.dept || '일반학과'
            })`,
            fields: [
              {
                name: '사유',
                value: discordCodeBlock(req2.message),
              },
            ],
            timestamp: new Date(),
            footer: {
              text: `ID: ${req2.id}`,
            },
            color: 0xff0000,
          },
        ],
      };
    case WebhookType.ReportCreate:
      const report: Report = data.data;
      return {
        content: `[REPORT/CREATE] ${report.id}`,
        embeds: [
          {
            title: '[REPORT/CREATE]',
            description: `신고자: ${userHyperlink(report.reportUserId, report.reportUserName)}\n신고 대상: ${report.targetId} **(${
              report.targetType
            })**`,
            fields: [
              {
                name: '신고 내용',
                value: discordCodeBlock(report.message),
              },
            ],
            timestamp: report.createdAt,
            footer: {
              text: `ID: ${report.id}`,
            },
            color: 0xff0000,
          },
        ],
      };
    case WebhookType.ReportComplete:
      const report1: Report = data.data;
      return {
        content: `[REPORT/COMPLETE] ${report1.id}`,
        description: `신고자: ${userHyperlink(report1.reportUserId, report1.reportUserName)}\n신고 대상: ${report1.targetId} **(${
          report1.targetType
        })**`,
        fields: [
          {
            name: '신고 내용',
            value: discordCodeBlock(report1.message),
          },
        ],
        timestamp: new Date(),
        footer: {
          text: `ID: ${report1.id}`,
        },
        color: 0x00ff00,
      };
    case WebhookType.BoardRequest:
      const req3: BoardRequest = data.data;
      return {
        content: `[BOARD/REQUEST] ${req3.id}`,
        embeds: [
          {
            title: '[BOARD/REQUEST]',
            description: `요청 정보: ${req3.schoolName} ${userHyperlink(req3.userId)}`,
            fields: [
              {
                name: '게시판 이름',
                value: discordCodeBlock(`+ ${req3.name}`, 'md'),
                inline: true,
              },
              {
                name: '게시판 설명',
                value: discordCodeBlock(`+ ${req3.description}`, 'md'),
                inline: true,
              },
            ],
            timestamp: new Date(),
            footer: {
              text: `ID: ${req3.id}`,
            },
            color: 0x00ff00,
          },
        ],
      };
    case WebhookType.BoardComplete:
      const req4: BoardRequest = data.data;
      const args = {
        title: 'ACCEPTED' ? req4.process === 'success' : 'REJECT',
        color: 0x00ff00 ? req4.process === 'success' : 0xff0000,
        sign: '+' ? req4.process === 'success' : '-',
      };
      return {
        content: `[BOARD/${args.title}] ${req4.id}`,
        embeds: [
          {
            title: `[BOARD/${args.title}]`,
            description: `요청 정보: ${req4.schoolName} ${userHyperlink(req4.userId)}`,
            fields: [
              {
                name: '게시판 이름',
                value: discordCodeBlock(`${args.sign} ${req4.name}`, 'md'),
                inline: true,
              },
              {
                name: '게시판 설명',
                value: discordCodeBlock(`${args.sign} ${req4.description}`, 'md'),
                inline: true,
              },
              {
                name: '메세지',
                value: discordCodeBlock(req4.message),
                inline: false,
              },
            ],
            timestamp: new Date(),
            footer: {
              text: `ID: ${req4.id}`,
            },
            color: args.color,
          },
        ],
      };
    case WebhookType.ArticleDelete:
      const article: ArticleWithBoard = data.data;
      return {
        content: `[ARTICLE/DELETE] ${article.id}`,
        embeds: [
          {
            title: '[ARTICLE/DELETE]',
            description: `게시판: ${article.board.name} | 조회수: ${article.views} | 작성자: ${userHyperlink(article.userId, article.user.name)}`,
            fields: [
              {
                name: '제목',
                value: discordCodeBlock(article.title),
                inline: false,
              },
              {
                name: '내용',
                value: discordCodeBlock(article.content),
                inline: false,
              },
            ],
            timestamp: new Date(),
            footer: {
              text: `ID: ${article.id}`,
            },
            color: 0xff0000,
          },
        ],
      };
  }
};
