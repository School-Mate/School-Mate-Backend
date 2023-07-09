interface IMealQuery {
  date?: string;
  startDate?: string;
  endDate?: string;
  // 1: 조식, 2: 중식, 3: 석식
  mealType?: '1' | '2' | '3';
}

interface ITimetableQuery {
  grade: number;
  class: number;
  semes?: number;
  dept?: string;
  year?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}
