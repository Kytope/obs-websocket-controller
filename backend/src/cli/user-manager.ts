import { Command } from 'commander';
import { UserService } from '../services/user.service';

const program = new Command();

program
  .name('user-manager')
  .description('CLI para gestionar usuarios de OBS Controller')
  .version('1.0.0');

program
  .command('add')
  .description('Añadir un nuevo usuario')
  .requiredOption('-u, --username <username>', 'Nombre de usuario')
  .requiredOption('-p, --password <password>', 'Contraseña')
  .requiredOption('-n, --name <name>', 'Nombre para mostrar')
  .action(async (options) => {
    try {
      console.log(`Creando usuario: ${options.username}...`);
      const id = await UserService.createUser({
        username: options.username,
        password: options.password,
        display_name: options.name
      });
      console.log(`✅ Usuario creado con éxito. ID: ${id}`);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        console.error('❌ Error: El nombre de usuario ya existe.');
      } else {
        console.error('❌ Error al crear usuario:', error.message);
      }
    }
  });

program
  .command('list')
  .description('Listar todos los usuarios')
  .action(async () => {
    try {
      const users = await UserService.listUsers();
      console.table(users);
    } catch (error: any) {
      console.error('Error al listar usuarios:', error.message);
    }
  });

program.parse(process.argv);