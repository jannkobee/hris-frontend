import axios from "@/plugins/axios";
import { ref } from "vue";
import { useUpload } from "./useUpload";
import { Data } from "@/types/types";

export const useApi = <T>(endpoint: string) => {
  const items = ref<T[]>([]);
  const loading = ref(false);
  const loadingActions = ref(false);
  const item = ref();
  const options = ref([]);
  const { downloadFile } = useUpload();

  const pagination = ref<
    Data & {
      sortBy?: { key: string; order: string }[];
      page?: number;
      itemsPerPage?: number;
      search?: string;
      relations?: string;
    }
  >({
    current_page: 0,
    from: 0,
    last_page: 0,
    per_page: 0,
    to: 0,
    total: 0,
  });

  const assignPagination = (data: Data) => {
    pagination.value.current_page = data.current_page;
    pagination.value.from = data.from;
    pagination.value.last_page = data.last_page;
    pagination.value.per_page = data.per_page;
    pagination.value.to = data.to;
    pagination.value.total = data.total;
  };

  async function index(options?: any) {
    loading.value = true;

    try {
      pagination.value = { ...pagination.value, ...options };

      const sort = pagination.value.sortBy?.[0] ?? { key: "", order: "" };

      const params = {
        page: pagination.value.page,
        limit: pagination.value.itemsPerPage,
        sort_by_column: sort.key,
        sort_by: sort.order,
        relations: pagination.value.relations,
        ...options,
      };

      delete params.sortBy;
      delete params.itemsPerPage;

      if (pagination.value.itemsPerPage) {
        params.limit = pagination.value.itemsPerPage;
      }

      if (!sort.key && !sort.order) {
        delete params.sort_by_column;
        delete params.sort_by;
      }

      const res = await axios.get(endpoint, { params });

      if (options?.all) {
        items.value = res.data.data;
      } else {
        items.value = res.data.data.data;

        assignPagination(res.data.data);
      }

      return res;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function store(payload: any) {
    loadingActions.value = true;

    try {
      const res = await axios.post(endpoint, payload);

      return res;
    } catch (error) {
      throw error;
    } finally {
      await index();

      loadingActions.value = false;
    }
  }

  async function show(id: any) {
    loading.value = true;

    try {
      const res = await axios.get(`${endpoint}/${id}`);

      items.value = res.data.data;

      return res.data.data;
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function update(id: any, payload: any) {
    loadingActions.value = true;

    try {
      const res = await axios.put(`${endpoint}/${id}`, payload);

      return res;
    } catch (error) {
      throw error;
    } finally {
      await index();

      loadingActions.value = false;
    }
  }

  async function destroy(id: number) {
    loadingActions.value = true;

    try {
      const res = await axios.delete(`${endpoint}/${id}`);

      return res;
    } catch (error) {
      throw error;
    } finally {
      await index();

      loadingActions.value = false;
    }
  }

  async function download(payload: any) {
    const res = await axios.get(`${endpoint}/export`, {
      params: { ...payload },
      responseType: "arraybuffer",
    });

    downloadFile(res.data, payload.filename);
  }

  async function getOptions() {
    loading.value = true;

    try {
      const payload = { all: 1 };

      const res = await axios.get(endpoint, { params: payload });

      return (options.value = res.data.data);
    } catch (error) {
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    endpoint,
    item,
    items,
    loading,
    loadingActions,
    options,
    pagination,
    index,
    store,
    show,
    update,
    destroy,
    download,
    getOptions,
  };
};
