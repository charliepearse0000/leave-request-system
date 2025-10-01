import { DataSource } from "typeorm";
import { Role } from "../../src/models/role.entity";
import { RoleType } from "../../src/models/role.entity";


export const createRoles = async (appDataSource: DataSource) => {
    const roleRepository = appDataSource.getRepository(Role);

    const roles = [
      {
        id: "0be2f8ec-7b36-4e3e-8f59-07630da7a0b5",
        type: RoleType.ADMIN,
        description: "Admin user",
      },
      {
        id: "41bf908b-d1d1-4498-b1b0-55998caa4ce4",
        type: RoleType.MANAGER,
        description: "Manager user",
      },
      {
        id: "5596b6ac-2059-4a6f-8522-4180c3c82e1a",
        type: RoleType.EMPLOYEE,
        description: "Employee User",
      },
    ];

    for (const role of roles) {
      const existingRole = await roleRepository.findOne({
        where: { id: role.id },
      });

      if (!existingRole) {
        await roleRepository.save(role);
        console.log(`Role ${role.type} created successfully`);
      }
    }
}