import types from './types'
import { SET_LOADING } from '../global/types'
import { filterAnswersByModuloId, resetSelectedChoiceOfQuestions, filterQuestionsByConfig } from './helper'
import { db, storage } from 'boot/firebase'
import { getDefaultConfigQuestionary } from './state'
import { LocalStorage } from 'quasar'

export default {
  updateAnswer ({ dispatch }, payload) {
    payload['idUsuario'] = this.state.usuario.id
    db.collection('respostas')
      .add(payload)
      .then(function () {
        dispatch('getAnswers')
      })
  },
  deleteAnswers ({ rootState, state }) {
    db.collection('respostas')
      .where('idUsuario', '==', rootState.usuario.id)
      .where('modulo', '==', `modulos/${state.choosedQuestionary.id}`)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => doc.ref.delete())
      })

    // .delete()
    // .then(function () {
    // })
  },
  getAnswers: ({ rootState, commit }) => {
    db.collection('respostas')
      .where('idUsuario', '==', LocalStorage.getItem('usuario').id)
      .get()
      .then(snapshot => {
        commit(types.SET_ANSWERS, snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      })
  },
  getQuestions ({ state, commit, dispatch }) {
    if (state.configQuestionary.eraseQuestions) {
      commit(types.SET_ANSWERS, [])
      dispatch('deleteAnswers')
    }
    commit(SET_LOADING, true, { root: true })

    db.collection('perguntas')
      .where('nivel', '==', state.configQuestionary.level)
      .where('modulo', '==', `modulos/${state.choosedQuestionary.id}`)
      .get()
      .then(snapshot => {
        let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        let answers = filterAnswersByModuloId(state.answers, state.choosedQuestionary.id)
        data = filterQuestionsByConfig(data, answers, state.configQuestionary)
        data = resetSelectedChoiceOfQuestions(data)

        let configQuestionary = state.configQuestionary
        configQuestionary.questionsSize = data.length
        commit(types.SET_CONFIG_QUESTIONARY, configQuestionary)
        commit(types.SET_QUESTIONS, data)
      })
      .then(() => { commit(SET_LOADING, false, { root: true }) })
  },
  nextQuestion ({ commit, state }) {
    if ((state.currentQuestionIndex + 1) === state.questions.length) return

    commit(types.SET_CURRENT_QUESTION_INDEX, ++state.currentQuestionIndex)
  },
  backQuestion ({ commit, state }) {
    if (state.currentQuestionIndex === 0) return

    commit(types.SET_CURRENT_QUESTION_INDEX, --state.currentQuestionIndex)
  },
  updateCurrentQuestionChoice ({ commit }, payload) {
    commit(types.UPDATE_CURRENT_ANSWER_CHOICE, payload)
  },
  resetChoices ({ getters }) {
    getters.getCurrentQuestion.respostas.forEach(element => {
      element.selecionada = false
    })
  },
  resetState ({ commit }) {
    commit(types.SET_CURRENT_QUESTION_INDEX, 0)
    commit(types.SET_QUESTIONS, [])
    commit(types.SET_CONFIG_QUESTIONARY, getDefaultConfigQuestionary())
    commit(types.SET_URL_FOR_IMAGE, null)
  },
  getImage ({ commit }, id) {
    let storageRef = storage.ref(`images/${id}.jpg`)
    storageRef.getDownloadURL().then(function (url) {
      commit(types.SET_URL_FOR_IMAGE, url)
    }).catch(() => {
      commit(types.SET_URL_FOR_IMAGE, null)
    })
  }

}