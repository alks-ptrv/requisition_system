<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="REQUISITIONS"
      :items-per-page="10"
      :expanded.sync="expanded"
      show-expand
      :search="search.search"
      :item-class="lines"
    >
      <template v-slot:top>
        <TopTable :search="search" />
      </template>

      <template v-slot:[`item.actions`]="{ item }">
        <ActionButtons
          :item="item"
          :havePermission="havePermission"
          :editedItem="editedItem"
          @sendToAgreement="sendToAgreement(item)"
          @openRequisition="openRequisition(item)"
        />
        <v-dialog
          v-model="dialogOpen"
          max-width="1200px"
          :retain-focus="false"
          @click:outside="closeRequisitionModalWindow"
        >
          <div class="white">
            <RequisitionStages
              :editedItem="editedItem"
              :havePermission="havePermission"
              :currentRequisitionStages="currentRequisitionStages"
              @closeRequisitionModalWindow="closeRequisitionModalWindow"
              @showInformativeMessage="showInformativeMessage"
            />
          </div>
        </v-dialog>
      </template>
      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length">
          <ExpandedInfo
            :item="item"
            :lastEvent="lastEvent"
            :allEventsOfSelectedRequisition="
              allEventsOfSelectedRequisition(item)
            "
          />
        </td>
      </template>
    </v-data-table>
    <InformativeMessage
      :snackbar="snackbar"
      @closeInformativeMessage="closeInformativeMessage"
    />
  </div>
</template>

<script>
import TopTable from "@/components/RequisitionSystem/TopTable";
import RequisitionStages from "@/components/RequisitionSystem/RequisitionStages";
import InformativeMessage from "@/components/RequisitionSystem/InformativeMessage";
import ActionButtons from "@/components/RequisitionSystem/ActionButtons";
import ExpandedInfo from "@/components/RequisitionSystem/ExpandedInfo";
import { mapGetters } from "vuex";

export default {
  components: {
    TopTable,
    RequisitionStages,
    InformativeMessage,
    ActionButtons,
    ExpandedInfo,
  },
  data: () => ({
    expanded: [],
    search: {
      search: "",
    },
    dialogOpen: false,
    snackbar: {
      snackbar: false,
    },
    headers: [
      { text: "№", value: "id" },
      { text: "Статус", value: "status", width: 250 },
      { text: "Этап заявки", value: "current_stage", width: 300 },
      { text: "Время создания", value: "create_date" },
      { text: "Заявитель", value: "requisition_creator" },
      { text: "Тип заявки", value: "requisition_type" },
      { text: "", value: "actions", width: 260, sortable: false },
    ],

    editedItem: {},
  }),
  methods: {
    lines(item) {
      switch (item.status) {
        case "Передана на визирование":
          return "yellow";
        case "Отклонена":
          return "red";
        case "Утверждена":
          return "green";
        case "Принята к исполнению":
          return "light-green";
        default:
          break;
      }
    },
    lastEvent(requisition) {
      let events = this.allEventsOfSelectedRequisition(requisition);
      let arrayOfIds = events.map((event) => event.id);
      let maxId = Math.max(...arrayOfIds);
      let lastEvent = this.ALL_EVENTS.find((event) => event.id === maxId);
      if (lastEvent === undefined) {
        return {
          date: "",
          status: "",
          requisition_id: 0,
          user: "",
          id: 0,
          last_complited_stage: "",
          current_stage: "",
        };
      }
      return lastEvent;
    },
    allEventsOfSelectedRequisition(requisition) {
      let arr = this.ALL_EVENTS.filter((event) => {
        return event.requisition_id === requisition.id;
      });
      if (arr !== undefined) {
        return arr;
      }
    },
    currentRequisitionStages(item) {
      let requisition = this.REQUISITION_TYPES.find(
        (type) => type.requisition_type == item.requisition_type
      );
      if (requisition != undefined) {
        return requisition.stages;
      }
    },
    havePermission(item) {
      let permission = this.CURRENT_USER_PERMISSIONS;
      let currentStage = this.currentRequisitionStages(item)[item.current_step];
      if (permission != undefined && currentStage != undefined) {
        return permission.indexOf(currentStage) != -1;
      }
      return false;
    },
    sendToAgreement(item) {
      return this.$store.dispatch("CHANGE_STAGE", {
        id: item.id,
        current_stage: this.currentRequisitionStages(item)[
          item.current_step + 1
        ],
        status: "Передана на визирование",
        last_complited_stage: "",
        current_step: 1,
        requisition_type: item.requisition_type,
      });
    },

    showInformativeMessage() {
      this.snackbar.snackbar = true;
    },
    closeInformativeMessage() {
      this.snackbar.snackbar = false;
    },
    openRequisition(item) {
      this.editedItem = Object.assign({}, item);
      this.dialogOpen = true;
    },
    closeRequisitionModalWindow() {
      this.dialogOpen = false;
    },
  },
  computed: {
    ...mapGetters([
      "REQUISITIONS",
      "REQUISITION_TYPES",
      "ALL_EVENTS",
      "CURRENT_USER_PERMISSIONS",
    ]),
  },
};
</script>

<style lang="css">
.red {
  color: black;
  background-color: red;
}

.green {
  color: black;
  background-color: green;
}

.light-green {
  color: black;
  background-color: rgb(105, 253, 105);
}

.yellow {
  color: black;
  background-color: yellow;
}
</style>
