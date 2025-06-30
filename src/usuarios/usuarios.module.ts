import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { NatsModule } from 'src/nats/nats.module';
import { HttpService } from 'src/common/services/http/http.service';
import { UsuariosRepository } from './repository/usuarios.repository';

@Module({
  controllers: [UsuariosController],
  providers: [HttpService, UsuariosService, UsuariosRepository],
  imports: [NatsModule]
})
export class UsuariosModule {}
