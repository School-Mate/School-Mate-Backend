interface IBoardRequestQuery {
  name: string;
  description: string;
  detail: string;
  userId: string;
}

interface IArticleQuery {
  title: string;
  content: string;
  images: string[];
  userId: string;
  isAnonymous: boolean;
}

interface ICommentQuery {
  commentId: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
}
