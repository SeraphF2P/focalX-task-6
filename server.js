const express = require("express");
const path = require("path");
const fsPromise = require("fs/promises");
const fs = require("fs");

const app = express();
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());

const uid = async () => {
  const filePath = path.join(__dirname, 'timestamps.json');

  let nextId;

  const timestampsExist = await fs.existsSync(filePath);
  if (timestampsExist) {
    const timestamps = await fsPromise.readFile(filePath, 'utf-8');
    const data = JSON.parse(timestamps);
    nextId = data.post + 1;
    data.post = nextId;
    await fsPromise.writeFile(filePath, JSON.stringify(data, null, 2));
  } else {
    nextId = 0;
    const initialData = { post: nextId };
    await fsPromise.writeFile(filePath, JSON.stringify(initialData, null, 2));
  }
  return nextId;
};


app.post("/api/post/create", async (req, res) => {
  try {
    const { userName, title, description } = req.body;

    if (!userName || !title || !description) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newPost = {
      id: await uid(),
      date: new Date(),
      userName,
      title,
      description,
    };
    const dataFile = await fsPromise.readFile(path.join(__dirname, "data.json"))
    const data = await JSON.parse(dataFile)
    const stringifiedData = JSON.stringify([...data, newPost], null, 2);
    await fsPromise.writeFile(path.join(__dirname, "data.json"), stringifiedData)

    return res.status(200).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.patch("/api/post/edit", async (req, res) => {
  try {
    const { id, userName, title, description } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const dataFile = await fsPromise.readFile(path.join(__dirname, "data.json"))
    const posts = await JSON.parse(dataFile)
    const postIndex = posts.findIndex(post => post.id === id)
    if (postIndex === -1) {
      return res.status(404).json({ error: "post not found" });
    }
    const post = posts[postIndex]
    const newPost = {
      ...post,
      updatedAt: new Date(),
      userName: userName ?? post.userName,
      title: title ?? post.title,
      description: description ?? post.description,
    };
    posts.splice(postIndex, 1, newPost);

    const stringifiedData = JSON.stringify(posts, null, 2);
    await fsPromise.writeFile(path.join(__dirname, "data.json"), stringifiedData)

    return res.status(200).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.delete("/api/post/delete", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const dataFile = await fsPromise.readFile(path.join(__dirname, "data.json"))
    const posts = await JSON.parse(dataFile)
    const postIndex = posts.findIndex(post => post.id === id)
    if (postIndex === -1) {
      return res.status(404).json({ error: "post not found" });
    }
    posts.splice(postIndex, 1);
    const stringifiedData = JSON.stringify(posts, null, 2);

    await fsPromise.writeFile(path.join(__dirname, "data.json"), stringifiedData)

    return res.status(200).send(true);
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/post/get-all", async (req, res) => {
  // return res.json({ data: "asdasd" })
  return res.send(await fsPromise.readFile(path.join(__dirname, "data.json")))
})
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});