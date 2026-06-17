import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/guards/auth.guards';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('json')
  async exportJson(@Res() res: Response) {
    const data = await this.exportService.exportJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=events.json');
    res.send(JSON.stringify(data, null, 2));
  }

  @Get('xml')
  async exportXml(@Res() res: Response) {
    const xml = await this.exportService.exportXml();
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=events.xml');
    res.send(xml);
  }
}
