import { Usuario } from "./usuario.entity";
import { ROL_USUARIO } from "./usuarios.enum";

export class Propietario extends Usuario{
    anotaciones: any[]
    constructor({id, nombre = 'Propietario', apellido='', email='', telefono='', 
        dni = '999999', username = '',chats = new Array<any>(), password = '', tokenDevices = new Array<any>(), notifications = new Array<any>(), 
        activo = true, profileURL = '', novedades = new Array<any>(), anotaciones = new Array<any>()}){
        super({id, nombre, apellido, email, telefono, role: ROL_USUARIO.PROPIETARIO, username, dni, chats, password, tokenDevices, notifications, activo, profileURL, novedades});
        this.anotaciones = anotaciones || [];

    }
}
