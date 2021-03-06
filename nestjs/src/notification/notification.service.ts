import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Notification } from './notification.entity';
import { User } from 'src/user/user.entity'

@Injectable()
export class NotificationService {
	constructor(
		@InjectRepository(Notification)
		private notificationRepository: Repository<Notification>,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService
	) {}

	async insert(id_user: number, msg: string, id_sender: number, url: string ): Promise<Notification>
	{
		const receiver = await this.userService.get(id_user, []);
		const sender = await this.userService.get(id_sender, []);
		return this.notificationRepository.save({ receiver, sender, msg, url });
	}

	async removeNotification(idUser: number, id_notification: number): Promise<DeleteResult>
	{
		const receiver = await this.userService.get(idUser, []);
		return this.notificationRepository.delete({ receiver, id: id_notification });
	}

	async removeAll(id_user: number): Promise<DeleteResult>
	{
		const receiver = await this.userService.get(id_user, []);
		return this.notificationRepository.delete({ receiver });
	}

	async removeAllByUser(user: User): Promise<DeleteResult>
	{
		return this.notificationRepository.delete({ receiver: user });
	}

	async markReadOne(idUser: number, id_notification: number): Promise<Notification>
	{
		const receiver = await this.userService.get(idUser, []);
		return this.notificationRepository.save({ where: { receiver }, id: id_notification, seen: true });
	}

	async markReadAll(id_user: number): Promise<UpdateResult>
	{
		const receiver = await this.userService.get(id_user, ["notifications"]);
		return this.notificationRepository.update({ receiver }, { seen: true });
	}
}
