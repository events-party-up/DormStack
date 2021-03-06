import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  Button,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Picker,
  ActivityIndicator
} from 'react-native';
import * as firebase from 'firebase';
import { StackNavigator } from 'react-navigation';
import { Hoshi } from 'react-native-textinput-effects';
import ImagePicker from 'react-native-image-crop-picker';
import RNFetchBlob from 'react-native-fetch-blob';
import Spinner from 'react-native-loading-spinner-overlay';
import DormStackItem from './DormStackItem';
import SelectImage from './SelectImage';

export default class CreateDorm extends Component {

    state = {
        error: '', 
        loading: false,
        Dorm: {dormName: '', dormDesc: '', dormImage: ''}, 
        User: {uid: '', school: '', first: '', last: ''}
    }

    static navigationOptions = {
        header: {
            style: {
                elevation: 0,
                shadowOpacity: 0,
                shadowOffset: {
                  height: 0,
                },
                shadowRadius: 0,
            }
        }
    }
    uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    GenerateQR = (DormKey) => {
  
        var addMemberId = this.uuidv4();
        var addRaId = this.uuidv4();
        var database = firebase.database();
        database.ref('school/' + this.state.User.school + '/' + DormKey + '/qr/res').set(addMemberId);
        database.ref('school/' + this.state.User.school + '/' + DormKey + '/qr/resad').set(addRaId);
        



    }
    onDormCreate = (DormKey) => {
        
        this.GenerateQR(DormKey);
        this.setState({loading: false});
        this.props.navigation.navigate('DormStack');
        
    }
    StoreImage = (database, dormKey, Dorm, User) => {
        const Blob = RNFetchBlob.polyfill.Blob;
        const fs = RNFetchBlob.fs;
        window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
        window.Blob = Blob;
    
        var image = JSON.parse(Dorm.dormImage);
        var imagePath = image.path;

        let uploadBlob = null;
        const imageRef = firebase.storage().ref(dormKey).child(Dorm.dormName + '.jpg');
        let mime = 'image/jpg';
        fs.readFile(imagePath, 'base64')
        .then((data) => {
            return Blob.build(data, {type: `${mime};BASE64`});
        })
        .then((blob) => {
            uploadBlob = blob;
            imageRef.put(blob, {contentType: mime}).then((snapshot) => {
                //Sets path of Image to variable
                var imageUrl = snapshot.ref.fullPath;
                //Create New Dorm in Database
                database.ref('school/' + User.school + '/' + dormKey + '/images').push({
                    url: imageUrl
                });
               
                this.onDormCreate(dormKey);
            });
        });
    }
    MakeDorm = (database, Dorm, User, ImageUrl) => {
        var dormRef = database.ref('school/' + User.school).push({
            name: Dorm.dormName,
            description: Dorm.dormDesc,
            motd: '',
        });
        var dormKey = dormRef.key;
        database.ref('school/' + User.school + '/' + dormKey + '/members').push({
            uid: User.uid,
            role: 0
        });
        this.StoreImage(database, dormKey, Dorm, User);
        
    }
    onCreatePress = () => {
        this.setState({loading:true});
        //Firebase Database Variable.
        var database = firebase.database();
        //Generates dormId and sets it's state variable.
        
        this.setState({Dorm: {
            dormName: this.state.Dorm.dormName,
            dormDesc: this.state.Dorm.dormDesc,
            dormImage: this.state.Dorm.dormImage
        }})
        
        //Gets the User's from firebase.auth() and then retrieves school from the database and sets its state.
        database.ref('users/' + firebase.auth().currentUser.uid).once('value').then((snapshot) => {
            this.setState({
                User: {
                    uid: firebase.auth().currentUser.uid,
                    school: snapshot.val().campus,
                    first: snapshot.val().firstname,
                    last: snapshot.val().lastname
                },
                
            });
            //Gets the User and new Dorm Objects from the state.
            const {Dorm, User} = this.state;
            //Verifies that there is a Dorm Name, if not, returns.
            if (Dorm.dormName == '') {
                this.setState({error: 'Please Enter a Dorm Name.', loading: false});
                return;
            }
            //Verifies that there is a Dorm Description, if not, returns.
            if (Dorm.dormDesc == '') {
                this.setState({error: 'Please Enter a Description for Your Dorm.', loading: false});
                return;
            }
            //Verifies that there is a Dorm Image, if not, returns.
            if (Dorm.dormImage == '') {
                this.setState({error: 'Please Select an Image for your Section.', loading: false});
                return;
            }
            //Verifies that there is a user uid set, if not, returns.
            if (User.uid == '') {
                this.setState({error: 'Could Not Verify User. This is an internal issue.', loading: false});
                return;
            }
            //Verifies that there is a user school, if not, returns.
            if (User.school == '') {
                this.setState({error: 'Could Not Verify School. This is an internal issue', loading: false});
            }
            //Executes 
            this.MakeDorm(database, Dorm, User);
            });

    }

    render() {
        return(
            <View>
                <Hoshi      
                        label={'Enter Dorm Name'}
                        borderColor={'black'}
                        labelStyle={{ color: 'black' }}
                        inputStyle={{ color: 'black' }}     
                        onChangeText={(dormName) => {
                            this.setState({Dorm: {
                                dormId: this.state.Dorm.dormId,
                                dormName: dormName,
                                dormDesc: this.state.Dorm.dormDesc,
                                dormImage: this.state.Dorm.dormImage
                            }});
                        }
                    }
            
                    />
                    <Hoshi      
                        label={'Enter Dorm Description'}
                        borderColor={'black'}
                        labelStyle={{ color: 'black' }}
                        inputStyle={{ color: 'black' }}
                        multiline={true}
                        style={{marginTop:20}}     
                        onChangeText={(dormDesc) => {
                            this.setState({Dorm: {
                                dormId: this.state.Dorm.dormId,
                                dormName: this.state.Dorm.dormName,
                                dormDesc: dormDesc,
                                dormImage: this.state.Dorm.dormImage
                            }});
                        }
                        }
            
                    />
                    <SelectImage
                        dormId={this.state.dormId}
                        stateDormImageJSON={DormImageJSON => {
                            this.setState({Dorm: {
                                dormId: this.state.Dorm.dormId,
                                dormName: this.state.Dorm.dormName,
                                dormDesc: this.state.Dorm.dormDesc,
                                dormImage: DormImageJSON.DormImageJSON
                            }
                    })}}
                    />
                    
                <TouchableOpacity
                disabled={this.state.loading}
                activeOpacity={this.state.loading ? 1 : 0.2}
                style={styles.button}
                onPress={this.onCreatePress.bind(this)}
                >
                    <Text style={styles.text}>Create Dorm</Text>
                </TouchableOpacity>
                <Text style={styles.errortext}>{this.state.error}</Text>
                <Text style={{textAlign: 'center'}}>Hint: You will be the Resident Advisor :)</Text>
                <Spinner style={{flex:1}} visible={this.state.loading} />
            </View>
        );
    }
}
const styles = StyleSheet.create({
    button: {
       
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#000000',
        marginTop: 30,
        height: 35
    },
    text: {
        
        fontSize: 20,
        fontFamily: 'Fjalla One',
        color: '#000000'
    },
    picker: {
        borderColor: '#000000',
        borderWidth: 1,
        
    },
    textarea: {
        borderColor: '#000000',
        borderWidth: 1,
        marginTop: 20
    },
    errortext: {
        textAlign: 'center',
        fontFamily: 'Fjalla One',
        color: 'red'
    },
    image: {
        // backgroundColor: '#CDB87D',
        height: 10
       

        
        
      },
});
