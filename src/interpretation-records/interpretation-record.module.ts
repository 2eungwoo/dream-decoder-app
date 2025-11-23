import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InterpretationRecord } from "./interpretation-record.entity";
import { InterpretationRecordService } from "./interpretation-record.service";
import { InterpretationRecordController } from "./interpretation-record.controller";
import { AuthModule } from "../auth/auth.module";
import { InterpretAuthGuard } from "../interpretation/guards/interpret-auth.guard";

@Module({
  imports: [TypeOrmModule.forFeature([InterpretationRecord]), AuthModule],
  controllers: [InterpretationRecordController],
  providers: [InterpretationRecordService, InterpretAuthGuard],
})
export class InterpretationRecordModule {}
