import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ROL_USUARIO } from './entities/usuarios.enum';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) { }

  @MessagePattern('usuarios.obtenerUsuarios')
  async obtenerUsuarios() {
    try {

      const data = await this.usuariosService.obtenerUsuarios();

      return data.map(usuario => ({
        ...usuario,
        chats: [],
        notifications: [],
        novedades: []
      }));
    } catch (err) {
      throw err
    }
  }


  @MessagePattern('usuarios.obtenerUsuario')
  async obtenerUsuarioByIdRequest(@Payload('usuarioId') usuarioId: string) {
    const data = (await this.usuariosService.obtenerUsuario(usuarioId));
    return data;
  }

  @MessagePattern('usuarios.propadmin')
  async obtenerPropAdmin() {
    const roles = [ROL_USUARIO.ADMIN, ROL_USUARIO.ARQUITECTO, ROL_USUARIO.COMPRADOR, ROL_USUARIO.CONTRATISTA, ROL_USUARIO.DELIVERY, ROL_USUARIO.PM, ROL_USUARIO.PROPIETARIO];
    return ((await this.usuariosService.obtenerUsuariosByRole(roles))
      .map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role })));
  }

  @MessagePattern('usuarios.obtenerUsuariosByRole')
  async obtenerUsuariosByRoles(@Payload() roles: number[]) {
    return ((await this.usuariosService.obtenerUsuariosByRole(roles))
      .map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role })));
  }

  @MessagePattern('usuarios.obtenerChatsExternoUsuario')
  async obtenerChatsExternoUsuario(@Payload('usuarioId') usuarioId: string) {
    return (await this.usuariosService.obtenerChatsExternoUsuario(usuarioId));
  }


  @MessagePattern('usuarios.admin')
  async obtenerPMO() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.ADMIN])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.pm')
  async obtenerPM() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.ARQUITECTO, ROL_USUARIO.PM])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.arquitecto')
  async obtenerArquitectos() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.PM])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.propietarios')
  async obtenerPropietarios() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.PROPIETARIO])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.obrero')
  async obtenerObreros() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.CONTRATISTA])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.compradores')
  async obtenerCompradores() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.COMPRADOR])).map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.profesionales')
  async obtenerProfesionales() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.PM, ROL_USUARIO.CONTRATISTA, ROL_USUARIO.COMPRADOR, ROL_USUARIO.DELIVERY, ROL_USUARIO.ARQUITECTO]))
      .map(usu => ({ nombre: usu.nombre, apellido: usu.apellido, dni: usu.dni, id: usu.id, role: usu.role }));
  }

  @MessagePattern('usuarios.usuariosAll')
  async obtenerUsuariosAll() {
    return (await this.usuariosService.obtenerUsuariosByRole([ROL_USUARIO.PM, ROL_USUARIO.PROPIETARIO, ROL_USUARIO.CONTRATISTA, ROL_USUARIO.COMPRADOR, ROL_USUARIO.DELIVERY, ROL_USUARIO.ARQUITECTO]));
  }

  @MessagePattern('usuarios.getNotifications')
  async obtenerNotifificacionesByUser(@Payload('usuarioId') usuarioId: string) {
    return (await this.usuariosService.obtenerNotifificacionesByUser(usuarioId));
  }

  @MessagePattern('usuarios.usuariosConChat')
  async obtenerUsuariosConChat(@Payload('usuarioId') usuarioId: string) {
    return (await this.usuariosService.obtenerUsuariosConChat(usuarioId));
  }

  @MessagePattern('usuarios.anotacionesByObra')
  async anotacionesByObra(@Payload('usuarioId') usuarioId: string) {
    return (await this.usuariosService.anotacionesByObra(usuarioId));
  }


  @MessagePattern('usuarios.crearUsuario')
  async crearUsuario(@Payload() dto: CreateUsuarioDto) {
    return (await this.usuariosService.crearUsuario(dto));
  }

  @MessagePattern('usuarios.login')
  async login(@Payload() dto: CreateUsuarioDto) {
    // return (await this.usuariosService.crearUsuario(dto)); TODO
  }

  @EventPattern('usuarios.tokenDevice')
  async registrarDispositivo(@Payload() body: any) {
    return (await this.usuariosService.registrarDispositivo(body));
  }


  @MessagePattern('usuarios.agregarAnotacion')
  async agregarAnotacion(@Payload() payload: any) {
    const { usuarioId, ...data } = payload
    return (await this.usuariosService.agregarAnotacion(usuarioId, data));
  }

  @MessagePattern('usuarios.eliminarAnotacion')
  async eliminarAnotacion(@Payload() payload: any) {
    const { usuarioId, anotId } = payload
    return (await this.usuariosService.eliminarAnotacion(usuarioId, anotId));
  }

  @MessagePattern('usuarios.deleteAllDevice') //Admin
  async deleteAllDevice() {
    return (await this.usuariosService.deleteAllDevice());
  }

  @MessagePattern('usuarios.deleteAllDeviceByUsuario') //Admin
  async deleteAllDeviceByUsuario(@Payload() payload: any) {
    const { usuarioId } = payload;
    return (await this.usuariosService.deleteAllDeviceByUsuario(usuarioId));
  }

  @MessagePattern('usuarios.password') // TODO instalar guard para que el token sea del id del usuario
  async cambiarPassword(@Payload() data: any) {
    return this.usuariosService.cambiarPassword(data);
  }

  @MessagePattern('usuarios.leerNotificaciones')
  async leerNotificaciones(@Payload('usuarioId') usuarioId: string) {
    return (await this.usuariosService.leerNotificaciones(usuarioId));
  }

  // @MessagePattern('usuarios.ultimoMensajeLeido/:usuarioId')
  // ultimoMensajeLeido(@Payload('usuarioId') id: string) {
  //   return this.usuariosService.ultimoMensajeLeido(id);
  // }

  @EventPattern('usuarios.deleteDevice')
  async deleteDevice(@Payload() data: any) {
    return await this.usuariosService.deleteDevice(data);
  }

  @MessagePattern('usuarios.actualizar')
  async modificarUsuario(@Payload() payload) {
    const { usuarioId, ...data } = payload;
    return (await this.usuariosService.actualizarUsuario(usuarioId, data));
  }


  @MessagePattern('usuarios.modificarAnotacion')
  async modificarAnotacion(@Payload() data: any) {
    return (await this.usuariosService.modificarAnotacion(data.usuarioId, data));
  }

  @MessagePattern('usuarios.desactivarUsuario')
  async desactivarUsuario(@Payload() payload: any) {
    const { usuarioId } = payload;
    return (await this.usuariosService.desactivarUsuario(usuarioId));
  }

  @EventPattern('usuarios.needReLogIn')
  async userNeedReLogIn(@Payload() payload: any) {
    const { usuarioId } = payload;
    return await this.usuariosService.userNeedReLogIn(usuarioId)
  }

  @EventPattern('usuarios.notNeedReLogIn')
  async userNotNeedReLogIn(@Payload() payload: any) {
    const { usuarioId } = payload;
    return await this.usuariosService.userNotNeedReLogIn(usuarioId)
  }

}