import { BadRequestException, ConflictException, HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { HttpService } from '../common/services/http/http.service';
import { Usuario } from './entities/usuario.entity';
import { encriptarPassword, getDataFromJSON, handlerError } from '../common/helpers/helper';
import { HttpError } from '../common/entities/httpError.entity';
import { UserFactory } from './entities/usuario.factory';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UsuariosRepository } from './repository/usuarios.repository';

@Injectable()
export class UsuariosService {

  ejecutado: boolean;

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    private readonly usuariosRepository: UsuariosRepository,
  ) {
    this.ejecutado = false;
  }

  async getObras() {
    return await firstValueFrom(this.client.send('obras.obtenerObras', {}))
  }
  async getObra(obraId) {
    return await firstValueFrom(this.client.send('obras.obtenerObra', { obraId }))
  }

  async anotacionesByObra(usuarioId: string) {

    try {

      let usuario = (await this.obtenerUsuario(usuarioId))!

      const obras = await this.getObras()
      let anotaciones: any[] = []
      let anotaciones_obra: any = []

      if (usuario.anotaciones) {
        anotaciones = usuario.anotaciones.filter(anota => anota.obraId)
        for (let anota of anotaciones) {
          let obra_response = await this.getObra(anota.obraId)
          anotaciones_obra.push({

            id: anota.id,
            obraId: anota.obraId,
            descripcion: anota.descripcion,
            tsGenerado: anota.tsGenerado,
            realizado: anota.realizado,
            tsRealizado: anota.tsRealizado,
            obra: {
              nombre: obra_response.nombre,
              barrio: obra_response.barrio,
              lote: obra_response.lote,
            }
          })

        }
      }


      return anotaciones_obra

    } catch (err) {
      handlerError(err);
    }
  }

  async desactivarUsuario(usuarioId) {
    try {

      let usuario = (await this.obtenerUsuario(usuarioId))!;
      await firstValueFrom(this.client.send('obras.quitarObrasFromUsuario', usuario));
      usuario.activo = false;
      usuario.tokenDevices = [];
      let data = await this.usuariosRepository.updateUsuario(usuario);
      return data;
    } catch (err) {
      console.log('err', err)
    }
  }

  async agregarNotificacionUsuario(usuarios: Usuario[], notificacion?, novedad?) {
    usuarios.forEach(async (usuario: Usuario) => {
      if (notificacion) usuario.agregarNotificacion(notificacion)
      if (novedad) {
        usuario.agregarNovedad(novedad)
        this.emitTo('novedad', usuario.novedades, new Array<string>(usuario.id!))
      }
      await this.usuariosRepository.updateUsuario(usuario);
    });
  }

  async modificarAnotacion(usuarioId: string, data: any) {
    try {
      const { id, tsRealizado, realizado, descripcion } = data;
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      let index = usuario.anotaciones!.findIndex(anota => anota.id.includes(id));
      usuario.anotaciones![index] = {
        ...usuario.anotaciones![index],
        tsRealizado,
        realizado,
        descripcion
      }
      return await this.usuariosRepository.updateUsuario(usuario);;

    } catch (err) {
      handlerError(err)
    }
  }


  async quitarNovedadPedidoUsuario(usuarios: Usuario[], pedido) {
    usuarios.forEach(async usuario => {
      if (!usuario.novedades) usuario.novedades = [];
      usuario.quitarNovedadPedido(pedido.id)
      this.emitTo('novedad', usuario.novedades, new Array<string>(usuario.id!))

      await this.usuariosRepository.updateUsuario(usuario);
    });
  }

  async leerNotificaciones(usuarioId: string) {
    try {
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      let notifSinLeer = usuario.notifications.filter(not => not.leido == false); // hora x dia x cant dias (3 dias)
      let novSinLeer = usuario.novedades!.filter(nov => nov.leido = false || !nov);
      if (notifSinLeer.length > 0) notifSinLeer.forEach(noti => noti.leido = true);
      if (novSinLeer.length > 0) novSinLeer.forEach(noti => noti.leido = true);
      if (notifSinLeer.length > 0 || novSinLeer.length > 0) await this.usuariosRepository.updateUsuario(usuario);

      return 'OK';
    } catch (err) {
      handlerError(err)
    }
  }
  async cambiarPassword(data: any) {
    const { usuarioId, password, newpass } = data;
    try {
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      usuario.password = await encriptarPassword(newpass);
      await this.usuariosRepository.updateUsuario(usuario);
      return usuario;
    }
    catch (err) {
      handlerError(err)
    }
  }

  async deleteAllDeviceByUsuario(usuarioId: string) {

    try {
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      if (usuario.tokenDevices) {
        usuario.tokenDevices = [];
        await this.usuariosRepository.updateUsuario(usuario);
      }
      return { success: true };
    } catch (err) {

      handlerError(err)
    }
  }

  async deleteAllDevice() {
    if (process.env.ISPRODUCTION == 'false') {
      try {
        let usuarios = await this.usuariosRepository.findAll();
        for (let usuario of usuarios) {
          if (usuario.tokenDevices) {
            usuario.tokenDevices = [];
            await this.usuariosRepository.updateUsuario(usuario);
          }
        }
        return { success: true };
      } catch (err) {
        handlerError(err)
      }
    }
  }

  async eliminarAnotacion(usuarioId: string, anotacionId: string) {
    try {
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      let index = usuario.anotaciones!.findIndex(anota => anota.id.includes(anotacionId));
      usuario.anotaciones!.splice(index, 1)
      let response = await this.usuariosRepository.updateUsuario(usuario);
      return response;
    } catch (err) {
      console.error(err);
      handlerError(err)
    }
  }

  private async emitTo(evento: string, data: any, destinos: string[]) {
    // const server = this.wsService.getWSServer();
    // destinos.forEach(destino => {
    //   server.to(destino).emit(evento, data);
    // })
  }


  async agregarAnotacion(usuarioId: string, data: any) {
    try {
      const { id, descripcion, obraId, tsGenerado, realizado } = data;
      let usuario = (await this.obtenerUsuario(usuarioId))!;
      if (!usuario.anotaciones) usuario.anotaciones = [];
      usuario.anotaciones.push({ id, descripcion, obraId, tsGenerado, realizado });
      let response = await this.usuariosRepository.updateUsuario(usuario);
      return response;
    } catch (err) {
      console.error(err);
      handlerError(err)
    }
  }

  async userNeedReLogIn(userId) {
    const usuario = await this.obtenerUsuario(userId);
    usuario.setNeedReLogIn()
    this.usuariosRepository.updateUsuario(usuario);
  }

  async userNotNeedReLogIn(userId) {
    const usuario = await this.obtenerUsuario(userId);
    usuario.setNotNeedReLogIn()
    this.usuariosRepository.updateUsuario(usuario);
  }

  obtenerUsuariosConChat(id: string) {
    throw new BadRequestException('Función fuera de servicio.');
  }
  asignarChatsToAdmin() {
    throw new BadRequestException('Función fuera de servicio.');
  }
  obtenerChatsExternoUsuario(id: string) {
    throw new BadRequestException('Función fuera de servicio.');
  }


  // obtenerUsuario = async (usuarioId, soloActivo = false): Promise<Usuario> => {
  //   const usuarios = await this.usuariosRepository.findAll();
  //   const usuario = usuarios.find(usuario => (usuario.id == usuarioId || usuario.dni == usuarioId));
  //   if (!usuario) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Usuario ${usuarioId} no encontrado` })
  //   return usuario
  // }


  obtenerUsuario = async (usuarioId, soloActivo = false): Promise<Usuario> => {
    const usuario = await this.usuariosRepository.findOne(usuarioId);
    if (!usuario) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Usuario ${usuarioId} no encontrado` })
    return usuario;
  }


  obtenerUsuarios = async (soloActivo = false): Promise<Usuario[]> => {
    const usuarios = await this.usuariosRepository.findAll();
    return usuarios;

  }


  async crearUsuario(usuarioDTO: CreateUsuarioDto) {
    try {
      let usuarios = await this.usuariosRepository.findAll()
      await this.checkExistenciaByDNI(usuarios, { usuarioDNI: usuarioDTO.dni.trim() });
      let usuario = UserFactory.newUser(usuarioDTO)

      const { username, password } = await this.generarUsuarioAuth(usuario)

      usuario.username = username;
      usuario.password = password;

      let new_user = await this.usuariosRepository.createUsuario(usuario);
      await this.grabarUsuarioAuth(usuario)

      return {
        id: new_user.id,
        nombre: new_user.nombre,
        apellido: new_user.apellido,
        email: new_user.email,
        telefono: new_user.telefono,
        role: new_user.role,
        dni: new_user.dni,
        username: new_user.username,
        profileURL: new_user.profileURL,
        needReLogIn: new_user.needReLogIn,
      };
    } catch (err) {
      throw err
    }
  }

  async generarUsuarioAuth(usuario) {
    const data = await firstValueFrom(this.client.send('auth.generateUser', usuario))
    return data;
  }

  async grabarUsuarioAuth(usuario: Usuario) {
    const authUser = {
      userId: usuario.id,
      email: usuario.email,
      password: usuario.password,
      username: usuario.username,
      role: 1
    }
    await firstValueFrom(this.client.emit('auth.create', authUser))
  }




  async obtenerNotifificacionesByUser(id: string) {
    try {
      let usuario = (await this.obtenerUsuario(id))!;

      const dias_atras = Date.now() - (3600000 * 24 * 10)

      let notificaciones = usuario.notificacionesOrdenadas.filter(not => not.ts > dias_atras); // hora x dia x cant dias
      return notificaciones

    } catch (err) {
      let error = new HttpError(err.message);

    }
  }

  async obtenerUsuariosByRole(roles: number[] = []) {
    let usuarios = await this.usuariosRepository.findAll();
    return usuarios.filter(usuario => roles.includes(usuario.role));
  }

  async obtenerUsuarioPassword({ username, password }) {
    let usuarios = await this.usuariosRepository.findAll();
    let encryptPassword = await encriptarPassword(password);
    return usuarios.find(user => user.username.toUpperCase() == username.trim().toUpperCase() && user.password == encryptPassword && user.activo);
  }


  async registrarDispositivo({ usuarioId, tokenDevice }) {

    try {
      if (!tokenDevice || tokenDevice == '') throw new BadRequestException('Token no proporcionado');

      let usuario = (await this.obtenerUsuario(usuarioId))!;

      if (usuario.tokenDevices) {
        let token = usuario.tokenDevices.find(a => a == tokenDevice)
        token ? false : usuario.tokenDevices.push(tokenDevice);
      }
      else {
        usuario.tokenDevices = [tokenDevice];
      }
      await this.usuariosRepository.updateUsuario(usuario);
      return usuario;
    } catch (err) {
      console.log('Error al registrar dispositivo')
      handlerError(err);
    }
  }


  private existeUsuario(usuarios: any[], nombre_usuario: string) {
    return usuarios.findIndex(x => x.username === nombre_usuario) > -1;
  }


  checkExistenciaByDNI(usuarios, { usuarioDNI = '', usuarioId = '' }) {
    let checkUsuarios = usuarios.filter(user => user.dni.trim() === usuarioDNI.trim())
    if ((checkUsuarios.length > 0) || (checkUsuarios.length == 1 && !checkUsuarios[0].id.includes(usuarioId))) {
      throw new RpcException(
        {
          message: 'DNI de usuario ya registrado',
          status: HttpStatus.CONFLICT
        }
      );
    }
  }




  // -------- WEB SOCKET 
  /*
  
        usuariosConectados: string[] = [];
  
  
      emitirUsuariosConectados(client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
          client.emit('usuarion-online', this.obtenerUsuariosConectados());
  
      }
  
      async quitarNovedad(client: Socket, usuarioId: any, novedadesId: string[]) {
          try {
  
              let usuario = (await this.obtenerUsuario(usuarioId))!;
              usuario.novedades = usuario.novedades?.filter(nov => novedadesId.includes(nov.id));
              await this.usuariosRepository.updateUsuario(usuario);
              client.emit('novedad', usuario.novedades);
          } catch (err) {
              console.log(err.message)
              client.emit('novedad', []);
          }
  
      }
  
      async conectarCliente(client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
          try {
              const usuarioId = this.verificarUsuario(client)
              console.log('Nuevo usuario conectado: ' + usuarioId)
              this.usuariosConectados.push(usuarioId);
  
              client.join(usuarioId!); // creo un canal directo con el dispositivo;
              client.emit('usuarion-online', this.usuariosConectados);
              client.emit('novedad', await this.obtenerNovedades(usuarioId));
              await this.emitirNotificaciones(client)
              client.broadcast.emit('usuarion-online', this.usuariosConectados);
  
          } catch (err) {
              console.log(err)
              // throw err
          }
      }
  
      obtenerUsuariosConectados() {
          return this.usuariosConectados;
      }
  
      desconectarCliente(client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  
          const userId = this.verificarUsuario(client)
          this.usuariosConectados = this.usuariosConectados.filter(id => id != userId);
  
          client.broadcast.emit('usuarion-online', this.usuariosConectados);
          console.log('Se ha desconectado un cliente ' + userId)
      }
  
      async emitirNotificaciones(client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
          try {
              const usuarioId = this.verificarUsuario(client);
              const usuario = await this.obtenerUsuario(usuarioId);
              client.emit('notifications-count', usuario.notificacionesOrdenadas);
          }
          catch (err) {
              console.log(err)
          }
      }
  
      async emitNovedades(client: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
  
          const usuarioId = (client.handshake.headers['x-token'] || client.handshake.query['x-token']) as string;
          const nov = await this.obtenerNovedades(usuarioId);
          client.emit('novedades', nov)
      } TODO todolo que tenga que ver con sockets
  
  
  
      private verificarUsuario(client) {
          const usuarioId = (client.handshake.auth['usuarioId'] || client.handshake.query['x-token']) as string;
          if (!usuarioId) throw new WsException('No se encontro usuarioId')
          return usuarioId;
      }*/

  private async obtenerNovedades(usuarioId: string) {

    const usuario = await this.obtenerUsuario(usuarioId);
    return usuario?.novedades;

  }

  async actualizarUsuario(usuarioId: string, data_update: any) {
    try {
      let usuarios = await this.usuariosRepository.findAll()
      if (!this.existeUsuarioId(usuarios, usuarioId)) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Usuario no existente' })
      if( usuarios.find( usu => (usu.dni === data_update.dni) && usu.id != usuarioId) ) throw new RpcException({ status: HttpStatus.CONFLICT, message: 'DNI ya registrado' })
      let usuario = (await this.obtenerUsuario(usuarioId))!;

      usuario.nombre = data_update.nombre.trim();
      usuario.apellido = data_update.apellido.trim();
      usuario.dni = data_update.dni.trim();
      usuario.telefono = data_update.telefono;
      usuario.email = data_update.email.trim();
      usuario.role = data_update.role;
      usuario.profileURL = data_update.profileURL || usuario?.profileURL;
      usuario.setNeedReLogIn()

      await this.usuariosRepository.updateUsuario(usuario);

      // modificar las obras que tengan al usuario
      await firstValueFrom(this.client.emit('obras.actualizaUsuarioObras', usuario))
      const authUser = {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        username: usuario.username,
        activo: usuario.activo,
        dni: usuario.dni,
        email: usuario.email,
        needReLogIn: usuario.needReLogIn,
        password: usuario.password,
        role: usuario.role,
        telefono: usuario.telefono,

      }
      await firstValueFrom(this.client.emit('auth.actualizarUser', authUser))

      // modificar los chats que contengan al usuario

      // modificar pedidos que contengan al usuario TODO

      return { id: usuarioId };

    } catch (err) {
      handlerError(err)
    }

  }
  existeUsuarioId(usuarios: Usuario[], usuarioId: string) {
    return usuarios.findIndex(usuario => usuario.id === usuarioId) >= 0;
  }



}