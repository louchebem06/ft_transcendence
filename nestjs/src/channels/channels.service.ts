import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channels } from './entity/channels.entity'
import { ChannelsInterface } from './interfaces/channels.interface'
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelsService {
	constructor(
	@InjectRepository(Channels)
		private channelsRepository: Repository<Channels>,
	) {}

	async createChannel(idAdmin: number, channel: ChannelsInterface): Promise<Channels>
	{
		const newChannels = new Channels();
		newChannels.id_admin = idAdmin;
		newChannels.users.push(idAdmin);
		if (channel.name !== undefined)
			newChannels.name = channel.name;
		if (channel.password !== undefined)
			newChannels.password = await bcrypt.hash(channel.password, await bcrypt.genSalt());
		// for decrypt
		// const isMatch = await bcrypt.compare(password, hash);
		
		if (channel.description !== undefined)
			newChannels.description = channel.description;
		newChannels.private = channel.private;
		return await this.channelsRepository.save(newChannels)
	}
}