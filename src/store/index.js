import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    users: [],
    requisition_types: [],
    requisitions: [],
    requisitions_history: [],
    selectedUser: JSON.parse(localStorage.getItem("selected_user")),
  },
  mutations: {
    SET_REQUISITIONS_TO_STATE: (state, requisitions) => {
      state.requisitions = requisitions;
    },
    SET_REQUISITION_TYPES_TO_STATE: (state, requisition_types) => {
      state.requisition_types = requisition_types;
    },
    SET_USERS_TO_STATE: (state, users) => {
      state.users = users;
    },
    SET_HISTORY_TO_STATE: (state, requisitions_history) => {
      state.requisitions_history = requisitions_history;
    },
    SET_SELECTED_USER: (state, selectedUser) => {
      state.selectedUser = selectedUser;
      localStorage.setItem("selected_user", JSON.stringify(state.selectedUser));
    },
  },

  actions: {
    async GET_REQUISITIONS({ commit }) {
      try {
        const response = await axios.get("http://localhost:3000/requisitions");
        if ([200].includes(response.status)) {
          commit("SET_REQUISITIONS_TO_STATE", response.data);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async GET_USERS({ commit }) {
      try {
        const response = await axios.get("http://localhost:3000/users");
        if ([200].includes(response.status)) {
          commit("SET_USERS_TO_STATE", response.data);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async GET_REQUISITION_TYPES({ commit }) {
      try {
        const response = await axios.get(
          "http://localhost:3000/requisition_types"
        );
        if ([200].includes(response.status)) {
          commit("SET_REQUISITION_TYPES_TO_STATE", response.data);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async GET_REQUISITIONS_HISTORY({ commit }) {
      try {
        const response = await axios.get(
          "http://localhost:3000/requisitions_history"
        );
        if ([200].includes(response.status)) {
          commit("SET_HISTORY_TO_STATE", response.data);
        }
      } catch (error) {
        console.log(error);
      }
    },
    async CREATE_REQUISITION(
      { dispatch, getters },
      {
        requisition_creator,
        requisition_type,
        current_step,
        create_date,
        status,
        last_complited_stage,
        current_stage,
      }
    ) {
      try {
        const response = await axios.post(
          "http://localhost:3000/requisitions",
          {
            requisition_creator,
            requisition_type,
            current_step,
            create_date,
            status,
            last_complited_stage,
            current_stage,
          }
        );
        if ([200, 201].includes(response.status)) {
          await dispatch("GET_REQUISITIONS");
          let requisition_id =
            getters.REQUISITIONS[getters.REQUISITIONS.length - 1].id;
          await dispatch("CREATE_EVENT", {
            status: status,
            requisition_id: requisition_id,
            current_stage: current_stage,
            last_complited_stage: last_complited_stage,
            requisition_type: requisition_type,
          });
        }
      } catch (error) {
        console.log(error);
      }
    },
    async CHANGE_STAGE(
      { dispatch },
      {
        id,
        current_stage,
        last_complited_stage,
        status,
        current_step,
        requisition_type,
      }
    ) {
      try {
        const response = await axios.patch(
          `http://localhost:3000/requisitions/${id}`,
          {
            status: status,
            current_step: current_step,
            last_complited_stage: last_complited_stage,
            current_stage: current_stage,
            requisition_type: requisition_type,
          }
        );
        if ([200, 201].includes(response.status)) {
          await dispatch("GET_REQUISITIONS");
          await dispatch("CREATE_EVENT", {
            status: status,
            requisition_id: id,
            current_stage: current_stage,
            last_complited_stage: last_complited_stage,
            requisition_type: requisition_type,
          });
        }
      } catch (error) {
        console.log(error);
      }
    },
    async CREATE_EVENT(
      { dispatch, getters },
      {
        status,
        requisition_id,
        current_stage,
        last_complited_stage,
        requisition_type,
      }
    ) {
      try {
        const response = await axios.post(
          "http://localhost:3000/requisitions_history",
          {
            date: new Date().toLocaleString(),
            status: status,
            user: getters.CURRENT_USER,
            requisition_id: requisition_id,
            last_complited_stage: last_complited_stage,
            current_stage: current_stage,
            requisition_type: requisition_type,
          }
        );
        if ([200, 201].includes(response.status)) {
          await dispatch("GET_REQUISITIONS");
          await dispatch("GET_REQUISITIONS_HISTORY");
        }
      } catch (error) {
        console.log(error);
      }
    },
  },
  getters: {
    REQUISITIONS(state) {
      return state.requisitions;
    },
    USERS(state) {
      return state.users.map((user) => user.name);
    },
    CURRENT_USER(state) {
      return state.selectedUser;
    },
    CURRENT_USER_PERMISSIONS(state, getters) {
      const currentUserObject = state.users.find(
        (user) => user.name == getters.CURRENT_USER
      );
      if (currentUserObject !== undefined) {
        return currentUserObject.permissions;
      }
    },
    REQUISITION_TYPES(state) {
      return state.requisition_types;
    },
    ALL_EVENTS(state) {
      return state.requisitions_history;
    },
  },
});
