import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose, { ConnectOptions, Document, Schema } from "mongoose";
import { PhysicalFolderHelper } from "./helpers/physicalFolder.helper";
const fs = require("fs");
dotenv.config();
const cors = require("cors");

const port = process.env.APP_PORT;

const app: Express = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON data
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to folder tree view");
});

// Connect to MongoDB

// const uri =
//   "mongodb+srv://codeware:codeware@cluster0.ssglgxr.mongodb.net/tree-folder?retryWrites=true&w=majority";
const uri =
  "mongodb+srv://cluster0.ssglgxr.mongodb.net/?retryWrites=true&w=majority";

const options: ConnectOptions = {
  user: "codeware",
  pass: "codeware",
  dbName: "tree-folder",
  // bufferCommands: false,
};
mongoose.connect(uri, options);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

export enum FolderType {
  ROOT = "root",
  SUB = "sub",
}
// Folder schema
const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  type: {
    type: String,
    enum: [FolderType],
    default: FolderType.SUB,
  },
  path: {
    type: String,
    default: "",
  },
});
const FolderModel = mongoose.model("Folder", folderSchema);

export interface IFolder {
  _id: mongoose.Types.ObjectId;
  name?: string;
}
async function constructFolderObject(obj: any) {
  const path = await constructFolderPath(obj.parentId);
  const folder = {
    name: obj?.name || "",
    path: path ?? "",
    parentId: new mongoose.Types.ObjectId(obj?.parentId ?? ""),
    type: "sub",
  };
  return folder;
}
async function constructFolderPath(parentId: string) {
  const parent = await findFolderById(parentId);
  let folderPath = "";
  if (!parent) {
    folderPath = "public/root";
  } else {
    folderPath = `${parent?.path}/${parent?.name}`;
  }
  return folderPath;
}
async function createRootFolder() {
  const folderObj = {
    name: "root",
    path: "public",
    parentId: new mongoose.Types.ObjectId(),
    type: FolderType.ROOT,
  };
  const res = await FolderModel.create(folderObj);
  const folder = res?.toObject();
  await PhysicalFolderHelper.getInstance().createFolder(folder);
  return folder;
}
async function createFolder(body: any) {
  const folderObj = await constructFolderObject(body);
  const res = await FolderModel.create(folderObj);
  const folder = res?.toObject();
  return folder;
}
async function findFolderByType(type: FolderType) {
  const res = await FolderModel.findOne({ type: type });
  const folder = await res?.toObject();
  if (!folder) {
    throw new Error("not found");
  }
  return folder;
}
async function getRootFolder() {
  let root: any;
  try {
    root = await findFolderByType(FolderType.ROOT);
    if (!root) {
      root = createRootFolder();
    }
  } catch (error) {
    if (error?.message == "not found") {
      root = await createRootFolder();
    }
  }
  return root;
}
async function findFolderById(folderId: any) {
  let folder: any;
  try {
    const res = await FolderModel.findById(folderId);
    folder = res?.toObject();
    if (!folder) {
      throw new Error("Folder not found");
    }
  } catch (error) {
    throw new Error(error?.message);
  }
  return folder;
}
async function findFoldersByParentId(parentId: string) {
  let folders: any;
  try {
    folders = await FolderModel.find({ parentId: parentId }).lean();
  } catch (error) {
    throw new Error(error?.message);
  }
  return folders;
}
async function checkDuplicateFolderName(body: any) {
  try {
    const folders = await FolderModel.find({
      parentId: body?.parentId,
      name: body?.name,
    });
    if (folders?.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw new Error(error?.message);
  }
}
async function updateFolder(id: string, newFolderName: string) {
  let folder = await FolderModel.findById(id);
  let oldName = folder?.name;
  if (!folder) {
    return null;
  }
  folder.name = newFolderName;
  folder = await folder.save();

  await PhysicalFolderHelper.getInstance().updateFolder(
    oldName,
    folder.toObject()
  );

  return folder;
}
async function deleteRootFolder() {
  try {
    await FolderModel.deleteMany();
    await PhysicalFolderHelper.getInstance().deleteRootFolder();
    return true;
  } catch (error) {
    console.log("Error for delete root folder: ", error?.message);
    return false;
  }
}
async function deleteFolderById(folderId: string) {
  const folder = await findFolderById(folderId);
  if (!folder) {
    return {
      message: "not found",
    };
  }
  if (folder.type == FolderType.ROOT) {
    return {
      message: "You have not permission to delete",
    };
  }
  const res = await FolderModel.findByIdAndDelete(folder?._id);
  const deleteFolder = res?.toObject();
  await PhysicalFolderHelper.getInstance().deleteFolder(folder);
  return {
    message: "success",
  };
}

async function buildFolderStructure(folder: any): Promise<any> {
  if (!folder) return null;
  let subfolders: any = await findFoldersByParentId(folder?._id);
  const children: any = await Promise.all(
    subfolders.map((subfolder: any) => buildFolderStructure(subfolder))
  );
  return {
    ...folder,
    subfolders: children,
  };
}

app.get("/folders/root-folder-structure", async (req, res) => {
  console.log("root tree");

  try {
    const folderStructure = await getRootFolderStructure();
    // const folderStructure =
    //   await PhysicalFolderHelper.getInstance().getAllNestedFolders();
    res.status(200).send({
      data: folderStructure,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      error: error?.message,
      success: false,
    });
  }
});
// Create Folder API (POST /folders)

app.post("/root-folder", async (req, res) => {
  try {
    const root = await getRootFolder();

    // const folderName = `${root?.path}/${root?.name}`;
    // const existFolder = await fs.existsSync(folderName);
    // if (!existFolder) {
    //   const ff = await fs.mkdirSync(folderName);
    // }

    PhysicalFolderHelper.getInstance().createFolder(root);

    res.status(200).send({
      data: root,
      success: true,
    });
  } catch (err) {
    console.error(err?.message);
    res.status(500).send({
      error: err,
      success: false,
    });
  }
});

app.post("/folder", async (req, res) => {
  try {
    const folderObj = req?.body;
    const exist = await checkDuplicateFolderName(folderObj);
    if (exist) {
      return res.status(409).send({
        error: "Duplicate folder name",
        success: false,
      });
    }
    const folder = await createFolder(folderObj);
    if (!folder) {
      return res.status(400).send({
        error: "Not create folder",
        success: false,
      });
    }

    // // Create the physical folder in the public directory
    await PhysicalFolderHelper.getInstance().createFolder(folder);

    res.status(200).send({
      data: folder,
      success: true,
    });

    // res.send(savedFolder);
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message);
  }
});

app.delete("/folder/all", async (req, res) => {
  try {
    const done = await deleteRootFolder();
    if (done) {
      return res.status(200).send({
        message: "deleted successfully",
        success: true,
      });
    } else {
      return res.status(200).send({
        error: "Failed to delete root folder",
        success: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete root folder");
  }
});
// Delete Folder API (DELETE /folders/:folderId)
app.delete("/folder/:folderId", async (req, res) => {
  try {
    const folderId = req.params.folderId;

    const deleteFolder = await deleteFolderById(folderId);

    if (deleteFolder?.message != "success") {
      return res.status(404).send({
        error: deleteFolder?.message,
        success: false,
      });
    }
    return res.status(200).send({
      message: "deleted successfully",
      success: true,
    });

    // // Delete the physical folder in the public directory
    // const folderPath = `public/${folder._id}`;
    // fs.rmdirSync(folderPath, { recursive: true });

    // // Delete the folder from MongoDB
    // // await folder.remove();

    // res.send("Folder deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete folder");
  }
});

app.get("/folder/:folderId", async (req, res) => {
  try {
    const folderId = req.params.folderId;

    const folder = await findFolderById(folderId);

    if (!folder) {
      return res.status(404).send({
        error: "Not found",
        success: false,
      });
    }
    return res.status(200).send({
      data: folder,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err?.message);
  }
});

// Update Folder API (PUT /folders/:folderId)
app.put("/folder/:folderId", async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const newFolderName = req.body.newFolderName;
    const folder = await updateFolder(folderId, newFolderName);
    if (!folder) {
      return res.status(404).send({
        error: "Folder not found",
        success: false,
      });
    }

    res.status(200).send({
      data: folder,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update folder");
  }
});

// Read All Folders API (GET /folders)
app.get("/folders", async (req, res) => {
  try {
    const folders = await getAllTheFolders();
    res.status(200).send({
      data: folders,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to read folders");
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
async function getRootFolderStructure() {
  const rootFolder = await getRootFolder();
  const folderStructure = await buildFolderStructure(rootFolder);
  return folderStructure;
}

async function getAllTheFolders() {
  const res = await FolderModel.find();
  const folders = await res;
  return folders;
}
