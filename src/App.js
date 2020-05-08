import React, { Component } from 'react'
import './App.css';

import * as firebase from "firebase";

import StyledFirebaseAuth from "react-firebaseui/StyledFirebaseAuth"

const firebaseConfig = {
  apiKey: "AIzaSyCJG3csISjnqYECDqEq17xZo7A76E_xRCk",
  authDomain: "qwertyuiop-ce33b.firebaseapp.com",
  databaseURL: "https://qwertyuiop-ce33b.firebaseio.com",
  projectId: "qwertyuiop-ce33b",
  storageBucket: "qwertyuiop-ce33b.appspot.com",
  messagingSenderId: "944391737597",
  appId: "1:944391737597:web:8b2944b6f436d5b1"
};
firebase.initializeApp(firebaseConfig)
var db = firebase.firestore()

export class App extends Component {
  constructor() {
    super()
    this.state = {
      meetingID: "",
      status: "",
      signedIn: false,
      detailsVerified: false,
      phone: "",
      zname: "",
      booked: false,
      data: {
        questions: 10,
        attendee: 12
      },
      zdata: { available: false, scheduledOn: "" },
      att: 0,
      que: 0,
      snaps: [],
    }
  }

  uiConfig = {
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    callbacks: {
      signInSuccess: () => {
        db.doc(`users/${firebase.auth().currentUser.uid}`)
          .get()
          .then(shot => {
            if (!shot.exists) {
              this.setState({
                detailsVerified: true
              })
            }
          })

        return false
      }
    }
  }

  componentDidMount() {
    
      const messaging = firebase.messaging();
      messaging
         .requestPermission()
         .then(() => {
            console.log("Have Permission");
            return messaging.getToken();
          })
         .then(token => {
            console.log("FCM Token:", token);
            //you probably want to send your new found FCM token to the
            //application server so that they can send any push
            //notification to you.
          })
         .catch(error => {
            if (error.code === "messaging/permission-blocked") {
               console.log("Please Unblock Notification Request Manually");
            } else {
               console.log("Error Occurred", error);
            }
           });
  
    db.doc("current-meeting/details").get().then(shot => {
      let data = shot.data();
      this.setState({
        meetingID: data.id,
        zdata: data
      })
      db.collection(this.state.meetingID)
        .orderBy("timestamp", "desc")
        .onSnapshot(snaps => {
          const data = []
          snaps.forEach(doc => {
            const d = doc.data()
            data.push({
              name: d.name,
              questions: d.questions,
              attendee: d.attendee
            })
          })
          this.setState({
            snaps: data
          })
        });
      if (firebase.auth().currentUser) {
        db.doc(`${this.state.meetingID}/${firebase.auth().currentUser.uid}`)
          .onSnapshot(shot => {
            if (shot.exists)
              this.setState({
                booked: true,
                data: shot.data()
              })
            else
              this.setState({
                booked: false,
                data: {}
              })
          })
      }
      db.doc("current-meeting/details").onSnapshot(shot => {
        let data = shot.data();
        if (data)
          this.setState({
            meetingID: data.id,
            zdata: data
          })
      })
    })

    firebase.auth().onAuthStateChanged(user => {
      this.setState({
        signedIn: !!user
      })

      if (user) {

        db.doc(`${this.state.meetingID}/${firebase.auth().currentUser.uid}`)
          .onSnapshot(shot => {
            if (shot.exists)
              this.setState({
                booked: true,
                data: shot.data()
              })
            else
              this.setState({
                booked: false,
                data: {}
              })
          })
      }
    })




  }

  bookMe = () => {
    let { att, que } = this.state
    if (isNaN(Number(att)) || isNaN(Number(que))) {
      alert("Please add a valid entry")
      return
    }
    db.doc(`${this.state.meetingID}/${firebase.auth().currentUser.uid}`)
      .set({
        questions: que,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        attendee: att
      })
      .then(() => {
        alert("done")
      })
  }

  addDetails = () => {
    alert(this.state.phone)
    db.doc(`users/${firebase.auth().currentUser.uid}`)
      .set({
        uid: firebase.auth().currentUser.uid,
        email: firebase.auth().currentUser.displayName,
        timestamp: Date.now(),
        name: firebase.auth().currentUser.displayName,
        phone: this.state.phone,
        zname: this.state.zname,
        photo: firebase.auth().currentUser.photoURL
      }).then(() => {
        this.setState({
          detailsVerified: false
        })
      })
  }
  render() {
    return (
      <div>
        <p>
          <b> Zoom Meeting is scheduled on {this.state.zdata.scheduledOn}</b>
          {this.state.signedIn ? this.state.booked ? this.state.zdata.available ?
            <p>
              <b>
                ID :- {this.state.zdata.zid}<br />
               Password :- {this.state.zdata.zpass}<br />
              Link :-<a href={this.state.zdata.zlink}>{this.state.zdata.zlink}</a> <br />
              </b>
            </p> : "" : "" : ""
          }

        </p>
        {this.state.detailsVerified ?
          <div>
            <p>Please add your personal details</p>
            <lable>Phone Number:- </lable>
            <input onChange={(e) => this.setState({ phone: e.target.value })} />
            <lable>Zoom name:- </lable>
            <input onChange={(e) => this.setState({ zname: e.target.value })} />
            <button onClick={this.addDetails}>Save</button>
          </div> :
          this.state.signedIn ?
            <div><p>
              Welcome :{firebase.auth().currentUser.displayName}</p>
              {this.state.booked ? <div>
                <p>You have booked Successfully !!</p>
                <p>Total attendee {this.state.data.attendee}, Total Questions {this.state.data.questions}</p>
              </div> : ""
              }

              <p>
                <label>Enter Total attendee :-</label>
                <input onChange={(e) => this.setState({ att: e.target.value })} />
              </p>
              <p>
                <label>Enter Total Question :-</label>
                <input onChange={(e) => this.setState({ que: e.target.value })} />
              </p>
              <p><button onClick={this.bookMe}>{this.state.booked ? "Update" : "Book"}</button></p>
              <button onClick={() => { firebase.auth().signOut() }}>SignOut</button>
              <div>
                <h3>Attendees :-</h3>
                {this.state.snaps.map((data, index) => (
                  <p>
                    {
                      `${data.name} ${
                      data.attendee - 1 > 0
                        ? " and " + Number(data.attendee - 1) + " others "
                        : ""
                      }will attend ${
                      data.questions > 0
                        ? "and ask " + Number(data.questions) + " question(s)"
                        : ""
                      }  `
                    }
                  </p>
                ))}
              </div>

            </div>
            :
            <div>
              <StyledFirebaseAuth
                uiConfig={this.uiConfig}
                firebaseAuth={firebase.auth()}
              />
            </div>
        }
      </div>
    )
  }
}

export default App

