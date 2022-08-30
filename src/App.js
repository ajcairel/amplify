import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { API, Storage } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
const initialFormState = { name: "", description: "" };

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({
      query: createNoteMutation,
      variables: { input: formData },
    });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter((note) => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <div className="App">
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <img src={logo} className="App-logo" alt="logo" />
            <h1>Hello {user.username}</h1>
            <Button variant="warning" onClick={signOut}>Sign Out</Button>
          </main>
        )}
      </Authenticator>
      <br/><br/>
      <h3>Create A Post</h3>
      <input
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        value={formData.name}
        />
          <br/><br/>
      <input
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description"
        value={formData.description}
        size="45"
        />
        <br/><br/>
      <input type="file" onChange={onChange} />
        
      <Button variant="success" onClick={createNote}>Create Post</Button>
        <br/><br/>
    
      <h1>My Posts</h1>
      <Container>
        <Row xs={2} md={3} lg={2} style={{justifyContent: "center"}}>
          
            {notes.map((note) => (
              <Card style={{ width: "15rem" }}>
                <Card.Body style={{ height: "5rem" }}>
                  <Card.Title>{note.name}</Card.Title>
                </Card.Body>
                {note.image && (
                  <Card.Img
                    variant="top"
                    src={note.image}
                    alt="Note"
                    style={{ height: "20rem", paddingBottom: "1rem" }}
                  />
                )}
                <Card.Footer style={{ height: "8rem", overflow: "scroll" }}>
                  <small className="text-muted">{note.description}</small>
                </Card.Footer>
                <Button variant="danger" onClick={() => deleteNote(note)}>
                  Delete
                </Button>
              </Card>
              // <div key={note.id || note.name}>
              //   <h2>{note.name}</h2>
              //   <p>{note.description}</p>
              //   {note.image && <img src={note.image} alt="Note" style={{ width: 400 }} />}
              //   <button onClick={() => deleteNote(note)}>Delete note</button>
              // </div>
            ))}
         
        </Row>
      </Container>
    </div>
  );
}

export default withAuthenticator(App);
