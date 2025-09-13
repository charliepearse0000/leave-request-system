import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

export enum RoleType {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    default: RoleType.EMPLOYEE,
  })
  name: RoleType;

  @Column({ length: 255 })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
} 