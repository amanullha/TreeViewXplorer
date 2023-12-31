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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderType = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const physicalFolder_helper_1 = require("./helpers/physicalFolder.helper");
const fs = require("fs");
dotenv_1.default.config();
const cors = require("cors");
const port = process.env.APP_PORT;
const app = (0, express_1.default)();
// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse JSON data
app.use(express_1.default.urlencoded({ extended: true })); // Parse URL-encoded data
app.get("/", (req, res) => {
    res.send("Welcome to folder tree view");
});
// Connect to MongoDB
// const uri =
//   "mongodb+srv://codeware:codeware@cluster0.ssglgxr.mongodb.net/tree-folder?retryWrites=true&w=majority";
const uri = "mongodb+srv://cluster0.ssglgxr.mongodb.net/?retryWrites=true&w=majority";
const options = {
    user: "codeware",
    pass: "codeware",
    dbName: "tree-folder",
    // bufferCommands: false,
};
mongoose_1.default.connect(uri, options);
const db = mongoose_1.default.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});
var FolderType;
(function (FolderType) {
    FolderType["ROOT"] = "root";
    FolderType["SUB"] = "sub";
})(FolderType = exports.FolderType || (exports.FolderType = {}));
// Folder schema
const folderSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    parentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
const FolderModel = mongoose_1.default.model("Folder", folderSchema);
function constructFolderObject(obj) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const path = yield constructFolderPath(obj.parentId);
        const folder = {
            name: (obj === null || obj === void 0 ? void 0 : obj.name) || "",
            path: path !== null && path !== void 0 ? path : "",
            parentId: new mongoose_1.default.Types.ObjectId((_a = obj === null || obj === void 0 ? void 0 : obj.parentId) !== null && _a !== void 0 ? _a : ""),
            type: "sub",
        };
        return folder;
    });
}
function constructFolderPath(parentId) {
    return __awaiter(this, void 0, void 0, function* () {
        const parent = yield findFolderById(parentId);
        let folderPath = "";
        if (!parent) {
            folderPath = "public/root";
        }
        else {
            folderPath = `${parent === null || parent === void 0 ? void 0 : parent.path}/${parent === null || parent === void 0 ? void 0 : parent.name}`;
        }
        return folderPath;
    });
}
function createRootFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        const folderObj = {
            name: "root",
            path: "public",
            parentId: new mongoose_1.default.Types.ObjectId(),
            type: FolderType.ROOT,
        };
        const res = yield FolderModel.create(folderObj);
        const folder = res === null || res === void 0 ? void 0 : res.toObject();
        yield physicalFolder_helper_1.PhysicalFolderHelper.getInstance().createFolder(folder);
        return folder;
    });
}
function createFolder(body) {
    return __awaiter(this, void 0, void 0, function* () {
        const folderObj = yield constructFolderObject(body);
        const res = yield FolderModel.create(folderObj);
        const folder = res === null || res === void 0 ? void 0 : res.toObject();
        return folder;
    });
}
function findFolderByType(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield FolderModel.findOne({ type: type });
        const folder = yield (res === null || res === void 0 ? void 0 : res.toObject());
        if (!folder) {
            throw new Error("not found");
        }
        return folder;
    });
}
function getRootFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        let root;
        try {
            root = yield findFolderByType(FolderType.ROOT);
            if (!root) {
                root = createRootFolder();
            }
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.message) == "not found") {
                root = yield createRootFolder();
            }
        }
        return root;
    });
}
function findFolderById(folderId) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder;
        try {
            const res = yield FolderModel.findById(folderId);
            folder = res === null || res === void 0 ? void 0 : res.toObject();
            if (!folder) {
                throw new Error("Folder not found");
            }
        }
        catch (error) {
            throw new Error(error === null || error === void 0 ? void 0 : error.message);
        }
        return folder;
    });
}
function findFoldersByParentId(parentId) {
    return __awaiter(this, void 0, void 0, function* () {
        let folders;
        try {
            folders = yield FolderModel.find({ parentId: parentId }).lean();
        }
        catch (error) {
            throw new Error(error === null || error === void 0 ? void 0 : error.message);
        }
        return folders;
    });
}
function checkDuplicateFolderName(body) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const folders = yield FolderModel.find({
                parentId: body === null || body === void 0 ? void 0 : body.parentId,
                name: body === null || body === void 0 ? void 0 : body.name,
            });
            if ((folders === null || folders === void 0 ? void 0 : folders.length) > 0) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            throw new Error(error === null || error === void 0 ? void 0 : error.message);
        }
    });
}
function updateFolder(id, newFolderName) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder = yield FolderModel.findById(id);
        let oldName = folder === null || folder === void 0 ? void 0 : folder.name;
        if (!folder) {
            return null;
        }
        folder.name = newFolderName;
        folder = yield folder.save();
        yield physicalFolder_helper_1.PhysicalFolderHelper.getInstance().updateFolder(oldName, folder.toObject());
        return folder;
    });
}
function deleteRootFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield FolderModel.deleteMany();
            yield physicalFolder_helper_1.PhysicalFolderHelper.getInstance().deleteRootFolder();
            return true;
        }
        catch (error) {
            console.log("Error for delete root folder: ", error === null || error === void 0 ? void 0 : error.message);
            return false;
        }
    });
}
function deleteFolderById(folderId) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = yield findFolderById(folderId);
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
        const res = yield FolderModel.findByIdAndDelete(folder === null || folder === void 0 ? void 0 : folder._id);
        const deleteFolder = res === null || res === void 0 ? void 0 : res.toObject();
        yield physicalFolder_helper_1.PhysicalFolderHelper.getInstance().deleteFolder(folder);
        return {
            message: "success",
        };
    });
}
function buildFolderStructure(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!folder)
            return null;
        let subfolders = yield findFoldersByParentId(folder === null || folder === void 0 ? void 0 : folder._id);
        const children = yield Promise.all(subfolders.map((subfolder) => buildFolderStructure(subfolder)));
        return Object.assign(Object.assign({}, folder), { subfolders: children });
    });
}
app.get("/folders/root-folder-structure", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("root tree");
    try {
        const folderStructure = yield getRootFolderStructure();
        // const folderStructure =
        //   await PhysicalFolderHelper.getInstance().getAllNestedFolders();
        res.status(200).send({
            data: folderStructure,
            success: true,
        });
    }
    catch (error) {
        res.status(500).send({
            error: error === null || error === void 0 ? void 0 : error.message,
            success: false,
        });
    }
}));
app.get("/folders/structure", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const folderId = req.query.folderId;
    try {
        let mainFolder;
        if (folderId) {
            mainFolder = yield findFolderById(folderId);
        }
        else {
            mainFolder = yield getRootFolder();
        }
        const subFolders = yield findFoldersByParentId(mainFolder === null || mainFolder === void 0 ? void 0 : mainFolder._id);
        res.status(200).send({
            data: subFolders,
            success: true,
        });
    }
    catch (error) {
        res.status(500).send({
            error: error === null || error === void 0 ? void 0 : error.message,
            success: false,
        });
    }
}));
// Create Folder API (POST /folders)
app.post("/root-folder", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const root = yield getRootFolder();
        // const folderName = `${root?.path}/${root?.name}`;
        // const existFolder = await fs.existsSync(folderName);
        // if (!existFolder) {
        //   const ff = await fs.mkdirSync(folderName);
        // }
        physicalFolder_helper_1.PhysicalFolderHelper.getInstance().createFolder(root);
        res.status(200).send({
            data: root,
            success: true,
        });
    }
    catch (err) {
        console.error(err === null || err === void 0 ? void 0 : err.message);
        res.status(500).send({
            error: err,
            success: false,
        });
    }
}));
app.post("/folder", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folderObj = req === null || req === void 0 ? void 0 : req.body;
        const exist = yield checkDuplicateFolderName(folderObj);
        if (exist) {
            return res.status(409).send({
                error: "Duplicate folder name",
                success: false,
            });
        }
        const folder = yield createFolder(folderObj);
        if (!folder) {
            return res.status(400).send({
                error: "Not create folder",
                success: false,
            });
        }
        // // Create the physical folder in the public directory
        yield physicalFolder_helper_1.PhysicalFolderHelper.getInstance().createFolder(folder);
        res.status(200).send({
            data: folder,
            success: true,
        });
        // res.send(savedFolder);
    }
    catch (err) {
        console.error(err);
        res.status(500).send(err === null || err === void 0 ? void 0 : err.message);
    }
}));
app.delete("/folder/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const done = yield deleteRootFolder();
        if (done) {
            return res.status(200).send({
                message: "deleted successfully",
                success: true,
            });
        }
        else {
            return res.status(200).send({
                error: "Failed to delete root folder",
                success: false,
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to delete root folder");
    }
}));
// Delete Folder API (DELETE /folders/:folderId)
app.delete("/folder/:folderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folderId = req.params.folderId;
        const deleteFolder = yield deleteFolderById(folderId);
        if ((deleteFolder === null || deleteFolder === void 0 ? void 0 : deleteFolder.message) != "success") {
            return res.status(404).send({
                error: deleteFolder === null || deleteFolder === void 0 ? void 0 : deleteFolder.message,
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to delete folder");
    }
}));
app.get("/folder/:folderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folderId = req.params.folderId;
        const folder = yield findFolderById(folderId);
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send(err === null || err === void 0 ? void 0 : err.message);
    }
}));
// Update Folder API (PUT /folders/:folderId)
app.put("/folder/:folderId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folderId = req.params.folderId;
        const newFolderName = req.body.newFolderName;
        const folder = yield updateFolder(folderId, newFolderName);
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to update folder");
    }
}));
// Read All Folders API (GET /folders)
app.get("/folders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const folders = yield getAllTheFolders();
        res.status(200).send({
            data: folders,
            success: true,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Failed to read folders");
    }
}));
// Define the Order schema
const orderSchema = new mongoose_1.default.Schema({
    orderItems: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "OrderItem" }],
    phone: String,
});
const Order = mongoose_1.default.model("Order", orderSchema);
// Define the OrderItem schema
const orderItemSchema = new mongoose_1.default.Schema({
    product: String,
    quantity: Number,
});
const OrderItem = mongoose_1.default.model("OrderItem", orderItemSchema);
// API endpoints
// Create an order
app.post("/orders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderItems, phone } = req.body;
        // Create order items
        const createdOrderItems = yield OrderItem.insertMany(orderItems);
        // Create order
        const order = new Order({
            orderItems: createdOrderItems.map((item) => item._id),
            phone,
        });
        // Save order
        yield order.save();
        res.status(201).send({
            data: order,
            success: true,
        });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "An error occurred" });
    }
}));
// Get an order by ID
app.get("/orders/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        // Find order by ID and populate order items
        const order = yield Order.findById(orderId).populate("orderItems");
        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }
        res.status(200).json({ order });
    }
    catch (error) {
        console.error("Error getting order:", error);
        res.status(500).json({ message: "An error occurred" });
    }
}));
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
function getRootFolderStructure() {
    return __awaiter(this, void 0, void 0, function* () {
        const rootFolder = yield getRootFolder();
        const folderStructure = yield buildFolderStructure(rootFolder);
        return folderStructure;
    });
}
function getAllTheFolders() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield FolderModel.find();
        const folders = yield res;
        return folders;
    });
}
//# sourceMappingURL=index.js.map