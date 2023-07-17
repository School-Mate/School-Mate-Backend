import { Article, Comment } from '@prisma/client';

export interface IBoardRequestQuery {
  name: string;
  description: string;
  detail: string;
  userId: string;
}

export interface IArticleQuery {
  title: string;
  content: string;
  images: string[];
  userId: string;
  isAnonymous: boolean;
}

export interface ICommentQuery {
  commentId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
}

export interface ArticleWithImage extends Article {
  keyOfImages: string[];
  commentCounts: number;
  likeCounts?: number;
  dislikeCounts?: number;
  isMe: boolean;
  User: {
    id: string;
    name: string;
  };
}

export interface Image {
  key: string;
}

export interface CommentWithUser extends Comment {
  User: {
    id: string;
    name?: string;
  };
  isMe: boolean;
  recomments?: CommentWithUser[];
}
