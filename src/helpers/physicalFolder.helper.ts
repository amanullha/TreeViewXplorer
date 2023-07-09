const fs = require("fs");
const path = require("path");

export class PhysicalFolderHelper {
  static instance: PhysicalFolderHelper = null;

  //   constructor() {
  //     if (PhysicalFolderHelper.instance) {
  //       return PhysicalFolderHelper.instance;
  //     }
  //     PhysicalFolderHelper.instance = this;
  //   }
  static getInstance() {
    if (PhysicalFolderHelper.instance) {
      return PhysicalFolderHelper.instance;
    }
    return new PhysicalFolderHelper();
  }

  async createFolder(folder: any) {
    const folderName = `${folder?.path}/${folder?.name}`;
    try {
      const existFolder = await fs.existsSync(folderName);
      if (!existFolder) {
        await fs.mkdirSync(folderName, { recursive: true });
        console.log(`Folder "${folder?.name}" created at ${folderName}`);
      }
    } catch (error) {
      console.error(`Error creating folder "${folderName}":`, error?.message);
    }
  }

  async deleteFolder(folder: any) {
    const folderPath = `${folder?.path}/${folder?.name}`;

    try {
      const existFolder = await fs.existsSync(folderPath);
      if (existFolder) {
        fs.rmSync(folderPath, { recursive: true });
        console.log(`Folder "${folder?.name}" deleted from ${folderPath}`);
      } else {
        console.log(`Folder doesn't exist`);
      }
    } catch (error) {
      console.error(`Error deleting folder "${folder?.name}":`, error);
    }
  }

  async updateFolder(OldFolderName: string, folder: any) {
    const newFolderPath = `${folder?.path}/${folder?.name}`;
    const oldFolderPath = `${folder?.path}/${OldFolderName}`;
    try {
      fs.renameSync(oldFolderPath, newFolderPath);
      console.log(`Folder "${oldFolderPath}" renamed to "${newFolderPath}"`);
    } catch (error) {
      console.error(`Error updating folder "${OldFolderName}":`, error);
    }
  }

  async readFolders(pathString?: string) {
    // const folderPath = path.join(pathString);
    const folderPath = "public";

    try {
      const folders = fs.readdirSync(folderPath);
      console.log(`Folders under ${folderPath}:`, folders);
      return folders;
    } catch (error) {
      console.error(`Error reading folders at ${folderPath}:`, error);
      return [];
    }
  }
  getAllNestedFolders() {
    const folderPath = "public";

    const nestedFolders: any = [];

    const traverseFolders = (currentFolderPath: any) => {
      const folders = fs.readdirSync(currentFolderPath);

      for (const folder of folders) {
        const nestedFolderPath = path.join(currentFolderPath, folder);
        const stats = fs.statSync(nestedFolderPath);

        if (stats.isDirectory()) {
          nestedFolders.push(nestedFolderPath);

          traverseFolders(nestedFolderPath); // Recursively traverse nested folders
        }
      }
    };

    traverseFolders(folderPath);

    return nestedFolders;
  }
}

// module.exports = PhysicalFolderHelper;
