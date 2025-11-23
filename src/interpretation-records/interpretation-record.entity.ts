import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { BaseTimeEntity } from "../shared/entities/base-time.entity";
import { User } from "../users/user.entity";
import { InterpretationRecordSymbol } from "./types/interpretation-record-symbol.type";

@Entity({ name: "interpretation_records" })
export class InterpretationRecord extends BaseTimeEntity {
  @Column({ type: "uuid" })
  public userId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "userId" })
  public user!: User;

  @Column({ type: "text" })
  public dream!: string;

  @Column({ type: "text", array: true, nullable: true })
  public emotions?: string[] | null;

  @Column({ type: "varchar", length: 4, nullable: true })
  public mbti?: string | null;

  @Column({ type: "text", nullable: true })
  public extraContext?: string | null;

  @Column({ type: "text" })
  public interpretation!: string;

  @Column({ type: "jsonb", nullable: true })
  public symbols?: InterpretationRecordSymbol[] | null;

  @Column({ type: "text", nullable: true })
  public userPrompt?: string | null;
}
