import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../user/user.entity'

@Entity()
export class Channel
{
	@PrimaryGeneratedColumn()
	id: number;

	@OneToOne(() => User)
	@JoinColumn()
	owner: User;

	@Column({ default: null })
	name?: string;

	@Column({ default: null })
	password?: string;

	@Column({ default: null })
	description?: string;

	@Column({ default: false })
	private: boolean;
}
