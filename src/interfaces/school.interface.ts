interface IMealQuery {
  date?: string;
  startDate?: string;
  endDate?: string;
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
