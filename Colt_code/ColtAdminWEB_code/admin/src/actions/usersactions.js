import { usersRef, singleUserRef, refUserChild } from "../config/firebase";
import {
  FETCH_ALL_USERS,
  FETCH_ALL_USERS_SUCCESS,
  FETCH_ALL_USERS_FAILED,
  EDIT_USER,
  EDIT_USER_SUCCESS,
  EDIT_USER_FAILED,
  DELETE_USER,
  DELETE_USER_SUCCESS,
  DELETE_USER_FAILED,
  BLOCK_USER,
  DESBLOCK_USER,
  CHANGE_STATUS
} from "./types";

export const fetchUsers = () => dispatch => {
  dispatch({
    type: FETCH_ALL_USERS,
    payload: null
  });
  usersRef.on("value", snapshot => {
    if (snapshot.val()) {
      const data = snapshot.val();
      const arr = Object.keys(data).map(i => {
        data[i].id = i;
        return data[i];
      });
      dispatch({
        type: FETCH_ALL_USERS_SUCCESS,
        payload: arr
      });
    } else {
      dispatch({
        type: FETCH_ALL_USERS_FAILED,
        payload: "No users available."
      });
    }
  });
};

export const changeStatus = (idDriver, status, child) => dispatch => {
  dispatch({
    type: CHANGE_STATUS,
    payload: null
  });
  refUserChild(idDriver, child).set(!status)
}

export const desblockUser = (idDriver) => dispatch => {
  dispatch({
    type: DESBLOCK_USER,
    payload: idDriver
  });
  refUserChild(idDriver, "blocked_by_admin").remove()
}

export const blockUser = (idDriver, motivo) => dispatch => {
  dispatch({
    type: BLOCK_USER,
    payload: motivo
  });
  singleUserRef(idDriver).update({
    blocked_by_admin: {
      motivo: motivo
    }
  })
}

export const editDriver = (idDriver, newDataDriver) => dispatch => {
  dispatch({
    type: EDIT_USER,
    payload: idDriver
  });
  singleUserRef(idDriver).once('value', snap => {
    if (snap.val()) {
      const driverData = snap.val()
      driverData.firstName = newDataDriver.firstName
      driverData.lastName = newDataDriver.lastName
      driverData.mobile = newDataDriver.mobile
      driverData.cpfNum = newDataDriver.cpfNum
      driverData.cnh = newDataDriver.cnh
      driverData.dataNasc = newDataDriver.dataNasc
      driverData.renavam = newDataDriver.renavam
      driverData.vehicleModel = newDataDriver.vehicleModel
      driverData.vehicleNumber = newDataDriver.vehicleNumber
      driverData.corVeh = newDataDriver.corVeh
      driverData.dataValidade = newDataDriver.dataValidade
      driverData.obsDriver = newDataDriver.obsDriver

      singleUserRef(idDriver).set(driverData).then(() => {
        dispatch({
          type: EDIT_USER_SUCCESS,
          payload: null
        });
        alert("Usuário alterado com sucesso!")
      }).catch((error) => {
        dispatch({
          type: EDIT_USER_FAILED,
          payload: error
        });
        alert("Erro ao alterar dados do usuário!")
      });
    }
  })
}

export const editUser = (id, user) => dispatch => {
  dispatch({
    type: EDIT_USER,
    payload: user
  });
  let editedUser = user;
  if (user.refferalBonus) editedUser.refferalBonus = parseFloat(editedUser.refferalBonus);
  delete editedUser.id;
  singleUserRef(id).set(editedUser).then(() => {
    dispatch({
      type: EDIT_USER_SUCCESS,
      payload: null
    });
  }).catch((error) => {
    dispatch({
      type: EDIT_USER_FAILED,
      payload: error
    });
  });
}

export const deleteUser = (id) => dispatch => {
  dispatch({
    type: DELETE_USER,
    payload: id
  });

  singleUserRef(id).remove().then(() => {
    dispatch({
      type: DELETE_USER_SUCCESS,
      payload: null
    });
  }).catch((error) => {
    dispatch({
      type: DELETE_USER_FAILED,
      payload: error
    });
  });

}