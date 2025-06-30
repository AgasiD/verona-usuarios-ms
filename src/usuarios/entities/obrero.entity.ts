import { Usuario } from "./usuario.entity";
import { ROL_USUARIO } from "./usuarios.enum";

export class Obrero extends Usuario{
    
    constructor({id, nombre = 'Obrero', apellido='', 
        email='', telefono='', dni = '', username = '', 
        chats = new Array<any>(), password = '', tokenDevices = new Array<any>(), 
        notifications = new Array<any>(), activo = true, profileURL = '', novedades = new Array<any>()}){
        super({id, nombre, apellido, email, telefono, role: ROL_USUARIO.CONTRATISTA, username, dni, chats, password, tokenDevices, notifications, activo, profileURL, novedades});

    }
}
