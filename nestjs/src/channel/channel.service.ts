import { forwardRef, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessChannel } from 'src/access-channel/access-channel.entity';
import { AccessChannelService } from 'src/access-channel/access-channel.service';
import { AdminChannel } from 'src/admin-channel/admin-channel.entity';
import { AdminChannelService } from 'src/admin-channel/admin-channel.service';
import { UserService } from 'src/user/user.service';
import { DeleteResult, Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { ChannelInterface } from './channel.interface';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';
import { BlacklistChannelService } from 'src/blacklist-channel/blacklist-channel.service';
import { BlacklistChannel } from 'src/blacklist-channel/blacklist-channel.entity';

@Injectable()
export class ChannelService {
	constructor(
		@InjectRepository(Channel)
		private channelRepository: Repository<Channel>,
		@Inject(forwardRef(() => AdminChannelService))
		private readonly adminChannelService: AdminChannelService,
		@Inject(forwardRef(() => AccessChannelService))
		private readonly accessChannelService: AccessChannelService,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
		private readonly blackListChannelService: BlacklistChannelService
	) {}

	async getALL(userId: number): Promise<Channel[]>
	{
		const user = await this.userService.get(userId, ["adminChannels", "accessChannels"]);
		let channels = await this.channelRepository.find({ where: [{private: false},
																	{private: true, owner: user}],
															select: ['id', 'name', 'password_is_set', 'description', 'private'] });
		for (let i = 0; i < user.adminChannels.length; i++)
			if (user.adminChannels[i].channel.private)
				channels.push(user.adminChannels[i].channel);
		for (let i = 0; i < user.accessChannels.length; i++)
			if (user.accessChannels[i].channel.private)
				channels.push(user.accessChannels[i].channel);
		return (channels);
	}

	async get(id: string): Promise<Channel>
	{
		return this.channelRepository.findOne({ where: { id },
												select: ['id', 'name', 'password_is_set', 'description', 'private'] });
	}

	async getIncludePassword(id: string): Promise<Channel>
	{
		return this.channelRepository.findOne({ where: { id } });
	}

	async getUsers(id_channel: string): Promise<User[]>
	{
		const channel = await this.get(id_channel);
		if (channel == undefined)
			throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
		const owner: User = channel.owner;
		let admins: User[] = await this.adminChannelService.getAdmins(channel);
		let access: User[] = await this.accessChannelService.getAccess(channel);
		return admins.concat(access, owner);
	}

	async create(id_user: number, channel: ChannelInterface): Promise<Channel>
	{
		const owner = await this.userService.get(id_user, []);
		if (owner === undefined)
			throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
		if (channel.password !== undefined && channel.password.length >= 1)
			channel.password = await bcrypt.hash(channel.password, 10);
		const tmp = await this.channelRepository.save({ owner: owner,
												name: channel.name,
												password_is_set: channel.password === "" ? false : true,
												password: channel.password,
												description: channel.description,
												private: channel.private
											});
		return this.get(tmp.id);
	}

	async isOwner(id_user: number, id_channel: string): Promise<boolean>
	{
		const channel = await this.get(id_channel);
		const user = await this.userService.get(id_user, []);
		if (user == undefined || channel == undefined)
			throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
		if (channel.owner.id == user.id)
			return true;
		return false;
	}

	async isAccess(id_user: number, id_channel: string): Promise<boolean>
	{
		if (await this.isOwner(id_user, id_channel) == true
		|| await this.accessChannelService.isAccess(id_user, id_channel) == true
		|| await this.adminChannelService.isAdmin(id_user, id_channel) == true)
			if (await this.blackListChannelService.isBan(id_user, id_channel) == false)
				return true;
		return false;
	}

	async remove(id_channel: string): Promise<DeleteResult>
	{
		return this.channelRepository.delete({ id: id_channel });	
	}
	
	async addAdmin(id_user: number, id_owner: number, id_channel: string): Promise<AdminChannel>
	{
		if (await this.isOwner(id_owner, id_channel) == false)
			throw new UnauthorizedException()
		const userAccess = await this.accessChannelService.isAccess(id_user, id_channel);
		if (userAccess)
			this.accessChannelService.remove(id_user, id_channel);
		return this.adminChannelService.insert(id_user, id_channel);
	}

	async addAccess(id_user: number, id_channel: string, password?: string): Promise<AccessChannel>
	{
		const channel = await this.getIncludePassword(id_channel);
		if (channel != undefined && channel.password != "")
			if (password == undefined || await bcrypt.compare(password, channel.password) == false)
				throw new UnauthorizedException()
		return this.accessChannelService.insert(id_user, id_channel);
	}

	async removeAdmin(id_user: number, id_owner: number, id_channel: string): Promise<DeleteResult>
	{
		if (await this.isOwner(id_owner, id_channel) == false)
			throw new UnauthorizedException()
		this.accessChannelService.insert(id_user, id_channel);
		return this.adminChannelService.remove(id_user, id_channel);
	}

	async removeAccess(id_user: number, id_admin: number, id_channel: string): Promise<DeleteResult>
	{
		if (await this.adminChannelService.isAdmin(id_admin, id_channel) == false
		&& await this.isOwner(id_admin, id_channel) == false)
			throw new UnauthorizedException()
		return this.accessChannelService.remove(id_user, id_channel);
	}

	async banUser(id_user: number, id_admin: number, id_channel: string, dateBan: string): Promise<BlacklistChannel>
	{
		const user_is_admin = await this.adminChannelService.isAdmin(id_user, id_channel);
		const admin_is_admin = await this.adminChannelService.isAdmin(id_admin, id_channel);
		const admin_is_owner = await this.isOwner(id_admin, id_channel);
		if ((admin_is_admin == false && admin_is_owner == false)
		|| (user_is_admin && admin_is_owner == false))
			throw new UnauthorizedException();
		return this.blackListChannelService.ban(id_user, id_channel, new Date(dateBan));
	}

	async unbanUser(id_user: number, id_admin: number, id_channel: string): Promise<DeleteResult>
	{
		if (await this.adminChannelService.isAdmin(id_admin, id_channel) == false
		&& await this.isOwner(id_admin, id_channel) == false)
			throw new UnauthorizedException();
		return this.blackListChannelService.unban(id_user, id_channel);
	}

	async getUsersBan(id_channel: string): Promise<User[]>
	{
		return this.blackListChannelService.listBan(id_channel);
	}

	async getChannels(id_user: number): Promise<string[]>
	{
		const user = await this.userService.get(id_user, ["ownerChannels", "adminChannels", "accessChannels"]);
		let channelIDS: string[] = [];
		for (let i = 0; i < user.ownerChannels.length; i++)
			channelIDS.push(user.ownerChannels[i].id)
		for (let i = 0; i < user.adminChannels.length; i++)
			channelIDS.push(user.adminChannels[i].channel.id)
		for (let i = 0; i < user.accessChannels.length; i++)
			channelIDS.push(user.accessChannels[i].channel.id)
		return (channelIDS);
	}
}
