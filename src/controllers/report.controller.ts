import { ReportDto } from '@/dtos/report.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ReportService from '@/services/report.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';

class ReportController {
  public reportService = new ReportService();

  public postReport = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const reportData = req.body as ReportDto;
      const user = req.user; // 신고자
      const report = await this.reportService.postReport(user, reportData);

      ResponseWrapper(req, res, {
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  public getReport = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const user = req.user; // 신고자
      const report = await this.reportService.getReport(user, reportId);

      ResponseWrapper(req, res, {
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };

  public postBlind = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const user = req.user; // 신고자
      const report = await this.reportService.postReportBlind(user, reportId);

      ResponseWrapper(req, res, {
        data: report,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ReportController;
