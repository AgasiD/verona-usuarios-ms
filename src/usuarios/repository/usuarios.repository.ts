import { HttpStatus, Injectable } from "@nestjs/common";
import { HttpService } from "src/common/services/http/http.service";
import { Usuario } from "../entities/usuario.entity";
import { encriptarPassword, getDataFromJSON, handlerError } from "src/common/helpers/helper";
import { UserFactory } from "../entities/usuario.factory";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class UsuariosRepository {

    uri: string
    usuarios: Usuario[] = new Array<Usuario>()
    constructor(private readonly http: HttpService) {

        this.uri = process.env.GOOGLE_URI + '/usuario'

    }

    async findAll() {
        if (this.usuarios.length == 0) await this.cargarUsuarios();

        return this.usuarios;

    }

    async findOne(usuarioId) {
        // let response = (await this.http.get(`${this.uri}/${usuarioId}.json`));
        // if (response.status >= 300) throw new RpcException({ message: response.statusText, status: response.status })
        // if (response.data === null) throw new RpcException({ message: 'Usuario no encontrado', status: 404 })
        // return UserFactory.newUser({ id: response.data.id, ...response.data })
        const usuarios = await this.findAll();
        return usuarios.find( user => user.id === usuarioId)
    }

    async createUsuario(usuario) {
        let response = await this.http.post(`${this.uri}.json`, {}, usuario);
        if (response.status >= 300) throw new RpcException({ message: response.statusText, status: response.status })
        let data = response.data;
        usuario.id = data.name;
        this.usuarios.push(usuario);
        return usuario;
    }

    async updateUsuario(usuario: Usuario) {

        if (usuario.id === null || usuario.id === undefined || usuario.id === '') throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Id vacío' });
        await this.cargarUsuarios();
        let userResponse = await this.http.patch(`${this.uri}/${usuario.id}.json`, {}, usuario); //?auth=${token} FORDEPLOY
        if (userResponse.status >= 300) throw new RpcException({ status: userResponse.status, message: userResponse.statusText })
        let index = this.usuarios.findIndex(user => user.id == usuario.id);
        let userUpdated = UserFactory.newUser(userResponse.data)
        this.usuarios[index] = userUpdated;
        return userUpdated;

    }

    private async cargarUsuarios() {
        try {
            let datos = (await this.http.get(this.uri + '.json')).data; //?auth='+token FORDEPLOY
            if (datos != null) {
                this.usuarios = getDataFromJSON(datos).map(data => UserFactory.newUser({ id: data.id, ...data.attributes }));
            } else {
                await this.crearUsuarioAdmin();
            }
            console.log('-- USUARIOS CARGADOS --');
        } catch (err) {
            console.log(`Error al cargar usuarios: ${err.message}`)
            throw err;
        }
    }


    private async crearUsuarioAdmin() {
        try {
            let usuario = {
                activo: true,
                apellido: "",
                chats: [],
                dni: "39769970",
                email: "agasidamian@gmail.com",
                nombre: "Admin",
                notifications: [],
                password: "123",
                telefono: "1166584411",
                tokenDevices: [],
                username: "admin",
                role: 1
            }
            const user = UserFactory.newUser({ usuario })
            user.password = await encriptarPassword(user.password);
            let response = await this.http.post(`${this.uri}.json`, {}, user);
            let data = response.data;
            user.id = data.name;
            this.usuarios.push(user);
            return user;
        } catch (err) {
            console.log(`Error al generar usuario administrador `, err);
            throw err;
        }
    }
}
