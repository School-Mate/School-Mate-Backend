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
