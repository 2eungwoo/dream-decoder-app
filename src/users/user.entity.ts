import { Column, Entity } from 'typeorm';
import { BaseTimeEntity } from '../shared/entities/base-time.entity';

@Entity({ name: 'users' })
export class User extends BaseTimeEntity {
  @Column({ unique: true })
  public username!: string;

  @Column()
  public passwordHash!: string;

  @Column({ default: false })
  public isLoggedIn!: boolean;
}
