//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config()
// const date = require(__dirname + "/date.js");

const app = express();

const USERNAME = process.env.ATLAS_USERNAME;

const PASSWORD = process.env.ATLAS_PASSWORD;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://"+USERNAME+":"+PASSWORD+"@cluster0.e1zufkx.mongodb.net/todolistDB"
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item .",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//

app.get("/", function (req, res) {
    try{
      Item.find({}, "name",(foundItems) => {
        if (foundItems.length === 0) {
          Item.insertMany(defaultItems)
            // .then(() => {
            //   console.log("successfully inserted");
            // })
            // .catch((e) => {
            //   console.log(e.message);
            // });
          res.redirect("/");
        } else {
          res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
      })

  }catch(e)  {
      console.log(e.message);
    };
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        //create a new list

        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/");
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((e) => {
      console.log(e.message);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch((e)=>{
      console.log(e.message);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Successfully removed checked item.");
        res.redirect("/");
      })
      .catch((e) => {
        console.log("error in deleting item");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(() => {
      res.redirect("/" + listName);
    }).catch((e)=>{
      console.log(e.message);
    });
  }
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
