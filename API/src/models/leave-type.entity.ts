import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LeaveRequest } from './leave-request.entity';

export enum LeaveTypeCategory {
  ANNUAL = 'annual',
  SICK = 'sick',
  OTHER = 'other',
}

@Entity('leave_types')
export class LeaveType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LeaveTypeCategory,
    default: LeaveTypeCategory.OTHER,
  })
  category: LeaveTypeCategory;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ default: true })
  deductsBalance: boolean;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.leaveType, { onDelete: 'CASCADE' })
  leaveRequests: LeaveRequest[];
} 