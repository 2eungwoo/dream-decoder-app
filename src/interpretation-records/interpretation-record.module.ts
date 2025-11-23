import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InterpretationRecord } from "./interpretation-record.entity";
import { InterpretationRecordService } from "./interpretation-record.service";
import { InterpretationRecordController } from "./interpretation-record.controller";
import { AuthModule } from "../auth/auth.module";
import { InterpretAuthGuard } from "../interpretation/guards/interpret-auth.guard";
import { InterpretationRecordValidator } from "./exceptions/interpretation-record.validator";
import { User } from "../users/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([InterpretationRecord, User]), AuthModule],
  controllers: [InterpretationRecordController],
  providers: [
    InterpretationRecordService,
    InterpretationRecordValidator,
    InterpretAuthGuard,
  ],
})
export class InterpretationRecordModule {}
