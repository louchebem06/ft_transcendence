import { BadGatewayException, Body, Controller, Delete, forwardRef, Get, Inject, Param, Post, Res } from '@nestjs/common';
import { AdminChannel } from 'src/admin-channel/admin-channel.entity';
import { Autorization } from 'src/auth.guard';
import { Message } from 'src/message/message.entity';
import { MessageService } from 'src/message/message.service';
import { DeleteResult } from 'typeorm';
import { Channel } from './channel.entity';
import { ChannelInterface } from './channel.interface';
import { ChannelService } from './channel.service';
import { User } from 'src/user/user.entity';
import { BlacklistChannel } from 'src/blacklist-channel/blacklist-channel.entity';
import { UserService } from 'src/user/user.service';

@Controller('channel')
export class ChannelController {
	constructor(private readonly channelService: ChannelService,
				private readonly messageService: MessageService) {}

	@Get()
	async getAll(@Autorization() userId: number): Promise<Channel[]>
	{
		return await this.channelService.getALL(userId);
	}

	@Get(':id_channel/users')
	async getUsers(@Param('id_channel') id_channel: string): Promise<User[]>
	{
		return await this.channelService.getUsers(id_channel);
	}

	@Get('friend/:id_friend')
	async getChannelMP(@Autorization() userId: number,
						@Param('id_friend') friendId: number,
						@Res() res: any): Promise<void>
	{
		const userChannels = await this.channelService.getChannels(userId);
		const friendChannels = await this.channelService.getChannels(friendId);
		const channels = userChannels.filter(channel => friendChannels.includes(channel))
		for (let i = 0; i < channels.length; i++)
		{
			const tmp = await this.channelService.getUsers(channels[i]);
			if (tmp.length == 2)
			{
				res.status(302).redirect(`/chat/${channels[i]}`);
				return ;
			}
		}
		const channel: ChannelInterface = {
			name: "Private Message",
			password: '',
			description: '',
			private: true
		};
		const createChannel = await this.channelService.create(userId, channel);
		await this.channelService.addAccess(friendId, createChannel.id, undefined);
		res.status(302).redirect(`/chat/${createChannel.id}`);
	}
	

	@Get(':id_channel/usersBan')
	async getUsersBan(@Param('id_channel') id_channel: string): Promise<User[]>
	{
		return await this.channelService.getUsersBan(id_channel);
	}

	@Post()
	async create(@Autorization() userId: number, @Body() body: ChannelInterface): Promise<Channel>
	{
		const channel: ChannelInterface = {
			name: body?.name ?? undefined,
			password: body?.password ?? undefined,
			description: body?.description ?? undefined,
			private: body?.private ?? false
		};
		return await this.channelService.create(userId, channel);
	}

	@Post(':id_channel')
	async access(@Param('id_channel') id_channel: string,
					@Autorization() userId: number,
					@Body() body: { password?: string }): Promise<{users: User[], msgs: Message[]}>
	{
		const access = await this.channelService.isAccess(userId, id_channel);
		if (!access)
			await this.channelService.addAccess(userId, id_channel, body?.password);
		const msgs: Message[] = await this.messageService.getMessages(id_channel);
		const users: User[] = await this.channelService.getUsers(id_channel);
		return ({ users, msgs });
	}

	@Post(':id_channel/addAdmin')
	async addAdmin(@Param('id_channel') id_channel: string,
					@Autorization() owner: number,
					@Body() body: { id_user: number }): Promise<AdminChannel>
	{
		return await this.channelService.addAdmin(body.id_user, owner, id_channel);
	}

	@Delete(':id_channel/removeAdmin')
	async removeAdmin(@Param('id_channel') id_channel: string,
					@Autorization() owner: number,
					@Body() body: { id_user: number }): Promise<DeleteResult>
	{
		return await this.channelService.removeAdmin(body.id_user, owner, id_channel);
	}

	@Delete(':id_channel/removeAccess')
	async removeAccess(@Param('id_channel') id_channel: string,
					@Autorization() sudo: number,
					@Body() body: { id_user: number }): Promise<DeleteResult>
	{
		return await this.channelService.removeAccess(body.id_user, sudo, id_channel);
	}

	@Post(':id_channel/ban')
	async ban(@Param('id_channel') id_channel: string,
					@Autorization() sudo: number,
					@Body() body: { id_user: number, date: string }): Promise<BlacklistChannel>
	{
		let dateBan: string = null;
		if (body.date !== "" && body.date !== null && body.date !== undefined)
			dateBan = body.date;
		return await this.channelService.banUser(body.id_user, sudo, id_channel, dateBan);
	}

	@Delete(':id_channel/unban')
	async unban(@Param('id_channel') id_channel: string,
					@Autorization() sudo: number,
					@Body() body: { id_user: number }): Promise<DeleteResult>
	{
		return await this.channelService.unbanUser(body.id_user, sudo, id_channel);
	}
}
