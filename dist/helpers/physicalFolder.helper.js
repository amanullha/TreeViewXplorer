"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicalFolderHelper = void 0;
const fs = require("fs");
const path = require("path");
class PhysicalFolderHelper {
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
    createFolder(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderName = `${folder === null || folder === void 0 ? void 0 : folder.path}/${folder === null || folder === void 0 ? void 0 : folder.name}`;
            try {
                const existFolder = yield fs.existsSync(folderName);
                if (!existFolder) {
                    yield fs.mkdirSync(folderName, { recursive: true });
                    console.log(`Folder "${folder === null || folder === void 0 ? void 0 : folder.name}" created at ${folderName}`);
                }
            }
            catch (error) {
                console.error(`Error creating folder "${folderName}":`, error === null || error === void 0 ? void 0 : error.message);
            }
        });
    }
    deleteFolder(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderPath = `${folder === null || folder === void 0 ? void 0 : folder.path}/${folder === null || folder === void 0 ? void 0 : folder.name}`;
            try {
                const existFolder = yield fs.existsSync(folderPath);
                if (existFolder) {
                    fs.rmSync(folderPath, { recursive: true });
                    console.log(`Folder "${folder === null || folder === void 0 ? void 0 : folder.name}" deleted from ${folderPath}`);
                }
                else {
                    console.log(`Folder doesn't exist`);
                }
            }
            catch (error) {
                console.error(`Error deleting folder "${folder === null || folder === void 0 ? void 0 : folder.name}":`, error);
            }
        });
    }
    updateFolder(OldFolderName, folder) {
        return __awaiter(this, void 0, void 0, function* () {
            const newFolderPath = `${folder === null || folder === void 0 ? void 0 : folder.path}/${folder === null || folder === void 0 ? void 0 : folder.name}`;
            const oldFolderPath = `${folder === null || folder === void 0 ? void 0 : folder.path}/${OldFolderName}`;
            try {
                fs.renameSync(oldFolderPath, newFolderPath);
                console.log(`Folder "${oldFolderPath}" renamed to "${newFolderPath}"`);
            }
            catch (error) {
                console.error(`Error updating folder "${OldFolderName}":`, error);
            }
        });
    }
    readFolders(pathString) {
        return __awaiter(this, void 0, void 0, function* () {
            // const folderPath = path.join(pathString);
            const folderPath = "public";
            try {
                const folders = fs.readdirSync(folderPath);
                console.log(`Folders under ${folderPath}:`, folders);
                return folders;
            }
            catch (error) {
                console.error(`Error reading folders at ${folderPath}:`, error);
                return [];
            }
        });
    }
    getAllNestedFolders() {
        const folderPath = "public";
        const nestedFolders = [];
        const traverseFolders = (currentFolderPath) => {
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
exports.PhysicalFolderHelper = PhysicalFolderHelper;
PhysicalFolderHelper.instance = null;
// module.exports = PhysicalFolderHelper;
//# sourceMappingURL=physicalFolder.helper.js.map